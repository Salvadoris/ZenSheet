using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using ZenSheet.Core.Constants;
using ZenSheet.Core.Interfaces;
using ZenSheet.Core.Models.Requests;
using ZenSheet.Core.Models.Responses;
using ZenSheet.Database.Contexts;
using ZenSheet.Database.Enums;
using ZenSheet.Database.Models;

namespace ZenSheet.Core.Services
{
    public class NoteService(MongoDbContext context, ILogger<NoteService> logger) : INoteService
    {
        private readonly MongoDbContext _context = context;
        private readonly ILogger<NoteService> _logger = logger;

        public async Task<string> CreateNoteAsync(CreateNoteRequest request)
        {
            var parentFolderId = string.IsNullOrWhiteSpace(request.ParentFolderId)
                ? FolderConstants.RootFolderId
                : request.ParentFolderId;

            var note = new Note
            {
                Title = request.Title,
                ParentFolderId = parentFolderId,
                Content = new NoteContent()
            };

            try
            {
                await _context.Notes.InsertOneAsync(note);
                _logger.LogInformation("Note created: {NoteId}, {NoteTitle}", note.Id, request.Title);
                return note.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create note");
                throw;
            }
        }

        public async Task<NoteResponse> GetNoteAsync(string noteId, string? clientId = null)
        {
            var note = await _context.Notes
                .Find(n => n.Id == noteId)
                .FirstOrDefaultAsync() ?? throw new KeyNotFoundException($"Note with ID {noteId} not found");

            var viewPosition = note.ViewPositions != null && note.ViewPositions.TryGetValue(clientId ?? "", out var clientViewPosition)
                ? new ViewPosition
                {
                    X = clientViewPosition[0],
                    Y = clientViewPosition[1]
                }
                : null;

            return MapNoteResponse(note, viewPosition);
        }

        public async Task<NoteResponse> UpdateNoteTitleAsync(string noteId, UpdateNoteTitleRequest request)
        {
            var update = Builders<Note>.Update
                .Set(n => n.Title, request.Title)
                .Set(n => n.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Notes.FindOneAndUpdateAsync(
                n => n.Id == noteId,
                update,
                new FindOneAndUpdateOptions<Note> { ReturnDocument = ReturnDocument.After }
            );

            if (result == null)
                throw new KeyNotFoundException($"Note with ID {noteId} not found");

            return await GetNoteAsync(noteId);
        }

        public async Task<NoteResponse> UpdateNoteContentAsync(string noteId, UpdateNoteContentRequest request)
        {
            if (request.Content != null)
            {
                foreach (var drawing in request.Content.Drawings)
                {
                    var sanitized = Utils.SerializationUtils.SanitizeDictionary(drawing.Properties!);
                    drawing.Properties = sanitized?.ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value ?? new object()
                    ) ?? [];
                }
                foreach (var shape in request.Content.Shapes)
                {
                    var sanitized = Utils.SerializationUtils.SanitizeDictionary(shape.Properties!);
                    shape.Properties = sanitized?.ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value ?? new object()
                    ) ?? [];
                }
            }

            var updateBuilder = Builders<Note>.Update;
            var updates = new List<UpdateDefinition<Note>>();

            if (request.Content != null)
            {
                updates.Add(updateBuilder.Set(n => n.Content, request.Content));
            }

            updates.Add(updateBuilder.Set(n => n.UpdatedAt, DateTime.UtcNow));

            if (request.ZoomScale.HasValue)
            {
                updates.Add(updateBuilder.Set(n => n.ZoomScale, request.ZoomScale.Value));
            }

            if (!string.IsNullOrEmpty(request.ClientId) && request.ViewPosition != null)
            {
                updates.Add(updateBuilder.Set($"viewPositions.{request.ClientId}", request.ViewPosition));
            }

            var update = updateBuilder.Combine(updates);

            var result = await _context.Notes.FindOneAndUpdateAsync(
                n => n.Id == noteId,
                update,
                new FindOneAndUpdateOptions<Note> { ReturnDocument = ReturnDocument.After }
            );

            if (result == null)
                throw new KeyNotFoundException($"Note with ID {noteId} not found");

            return await GetNoteAsync(noteId, request.ClientId);
        }

        public async Task DeleteNoteAsync(string noteId)
        {
            var result = await _context.Notes.DeleteOneAsync(n => n.Id == noteId);

            if (result.DeletedCount == 0)
                throw new KeyNotFoundException($"Note with ID {noteId} not found");

            await _context.CanvasActions.DeleteManyAsync(a => a.NoteId == noteId);

            _logger.LogInformation("Note deleted: {NoteId}", noteId);
        }

        public async Task<NoteResponse> GetNoteWithActionsAsync(string noteId)
        {
            return await GetNoteAsync(noteId);
        }

        public async Task ApplyActionAsync(string noteId, CanvasAction action)
        {
            var note = await _context.Notes.Find(n => n.Id == noteId).FirstOrDefaultAsync();
            if (note == null) return;

            bool modified = false;
            var payload = action.Payload;
            if (payload.TryGetValue("data", out var dataObj) && dataObj is Dictionary<string, object> data)
            {
                payload = data;
            }

            modified = action.ActionType switch
            {
                ActionType.AddShapes => HandleAddShapes(note, payload),
                ActionType.RemoveShapes => HandleRemoveShapes(note, payload),
                ActionType.ChangeShapesProperties => HandleChangeShapesProperties(note, payload),
                ActionType.AddDrawings => HandleAddDrawings(note, payload),
                ActionType.RemoveDrawings => HandleRemoveDrawings(note, payload),
                ActionType.ChangeDrawingProperties => HandleChangeDrawingProperties(note, payload),
                ActionType.DrawingToShape => HandleDrawingToShape(note, payload),
                ActionType.AddGroupShape => HandleAddGroupShape(note, payload),
                ActionType.RemoveGroupShape => HandleRemoveGroupShape(note, payload),
                ActionType.ShapeToLocal => HandleShapeToLocal(note, payload),
                _ => false
            };

            if (modified)
            {
                await _context.Notes.ReplaceOneAsync(n => n.Id == noteId, note);
            }
        }

        public async Task<NoteResponse> InsertNoteFromDB(string noteId, string destinationFolderId)
        {
            var existingNote = await _context.Notes.Find(n => n.Id == noteId).FirstOrDefaultAsync()
                               ?? throw new KeyNotFoundException($"Note with ID {noteId} not found in cloud database");

            existingNote.Id = ObjectId.GenerateNewId().ToString();
            existingNote.ParentFolderId = string.IsNullOrWhiteSpace(destinationFolderId) ? FolderConstants.RootFolderId : destinationFolderId;
            existingNote.CreatedAt = DateTime.UtcNow;
            existingNote.UpdatedAt = DateTime.UtcNow;
            existingNote.Title = $"{existingNote.Title} (Copy)";

            await _context.Notes.InsertOneAsync(existingNote);
            _logger.LogInformation("Note copied: {OriginalId} -> {NewId}", noteId, existingNote.Id);

            return await GetNoteAsync(existingNote.Id);
        }

        public async Task<NoteResponse> InsertNoteFromLocal(InsertNoteRequest request)
        {
            if (request?.NoteData == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (string.IsNullOrEmpty(request.DestinationFolderId)) { 
                throw new ArgumentException("DestinationFolderId cannot be null or empty");
            }

            if (request.NoteData.Content != null)
            {
                if (request.NoteData.Content.Drawings != null)
                {
                    foreach (var drawing in request.NoteData.Content.Drawings)
                    {
                        var sanitized = Utils.SerializationUtils.SanitizeDictionary(drawing.Properties!);
                        drawing.Properties = sanitized?.ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value ?? new object()
                        ) ?? [];
                    }
                }
                if (request.NoteData.Content.Shapes != null)
                {
                    foreach (var shape in request.NoteData.Content.Shapes)
                    {
                        var sanitized = Utils.SerializationUtils.SanitizeDictionary(shape.Properties!);
                        shape.Properties = sanitized?.ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value ?? new object()
                        ) ?? [];
                    }
                }
            }

            var note = new Note 
            {
                Id = ObjectId.GenerateNewId().ToString(),
                ParentFolderId = request.DestinationFolderId,
                Title = request.NoteData.Title,
                Content = new NoteContent
                {
                    Drawings = request.NoteData.Content?.Drawings ?? [],
                    Shapes = request.NoteData.Content?.Shapes ?? []
                },
                ViewPositions = request.NoteData.ViewPositions?.ToDictionary(
                    kvp => kvp.Key,
                    kvp => new[] { (float)kvp.Value.X, (float)kvp.Value.Y }
                ) ?? [],
                ZoomScale = request.NoteData.ZoomScale,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Notes.InsertOneAsync(note);
            _logger.LogInformation("Local note inserted: {NoteId}", note.Id);

            return await GetNoteAsync(note.Id);
        }

        private bool HandleAddShapes(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("shapes", out var shapesObj) || shapesObj is not List<object> shapesList)
                return false;

            bool modified = false;
            foreach (var s in shapesList)
            {
                if (s is Dictionary<string, object> sDict)
                {
                    note.Content.Shapes.Add(new Shape
                    {
                        Type = sDict.TryGetValue("type", out var t) ? t.ToString()! : "Rectangle",
                        Properties = sDict.TryGetValue("properties", out var p) && p is Dictionary<string, object> pd ? pd : new()
                    });
                    modified = true;
                }
            }
            return modified;
        }

        private bool HandleRemoveShapes(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("shapeIdList", out var idListObj) || idListObj is not List<object> idList)
                return false;

            var ids = idList.Select(x => x.ToString()).ToHashSet();
            note.Content.Shapes.RemoveAll(s => s.Properties.TryGetValue("id", out var id) && ids.Contains(id.ToString()));
            return true;
        }

        private bool HandleChangeShapesProperties(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("shapeIdList", out var idListObj) || idListObj is not List<object> idList ||
                !payload.TryGetValue("properties", out var propsObj) || propsObj is not Dictionary<string, object> props)
                return false;

            var ids = idList.Select(x => x.ToString()).ToHashSet();
            bool modified = false;
            foreach (var shape in note.Content.Shapes.Where(s => s.Properties.TryGetValue("id", out var id) && ids.Contains(id.ToString())))
            {
                ApplyPropertiesUpdate(shape.Properties, props);
                modified = true;
            }
            return modified;
        }

        private bool HandleAddDrawings(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("drawings", out var drawingsObj) || drawingsObj is not List<object> drawingsList)
                return false;

            bool modified = false;
            foreach (var d in drawingsList)
            {
                if (d is Dictionary<string, object> dDict)
                {
                    note.Content.Drawings.Add(new Drawing
                    {
                        Type = dDict.TryGetValue("type", out var t) ? t.ToString()! : "Pen",
                        Properties = dDict.TryGetValue("properties", out var p) && p is Dictionary<string, object> pd ? pd : new()
                    });
                    modified = true;
                }
            }
            return modified;
        }

        private bool HandleRemoveDrawings(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("drawingIdList", out var idListObj) || idListObj is not List<object> idList)
                return false;

            var ids = idList.Select(x => x.ToString()).ToHashSet();
            note.Content.Drawings.RemoveAll(d => d.Properties.TryGetValue("id", out var id) && ids.Contains(id.ToString()));
            return true;
        }

        private bool HandleChangeDrawingProperties(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("drawingIdList", out var idListObj) || idListObj is not List<object> idList ||
                !payload.TryGetValue("properties", out var propsObj) || propsObj is not Dictionary<string, object> props)
                return false;

            var ids = idList.Select(x => x.ToString()).ToHashSet();
            bool modified = false;
            foreach (var drawing in note.Content.Drawings.Where(d => d.Properties.TryGetValue("id", out var id) && ids.Contains(id.ToString())))
            {
                ApplyDrawingPropertiesUpdate(drawing.Properties, props);
                if (!props.ContainsKey("points") || (props.TryGetValue("edited", out var edited) && edited is false))
                {
                    modified = true;
                }
            }
            return modified;
        }

        private bool HandleDrawingToShape(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("drawingId", out var drawId) ||
                !payload.TryGetValue("shape", out var nsObj) || nsObj is not Dictionary<string, object> nsDict)
                return false;

            var id = drawId.ToString();
            note.Content.Drawings.RemoveAll(d => d.Properties.TryGetValue("id", out var pid) && pid.ToString() == id);
            note.Content.Shapes.Add(new Shape
            {
                Type = nsDict.TryGetValue("type", out var t) ? t.ToString()! : "Rectangle",
                Properties = nsDict.TryGetValue("properties", out var p) && p is Dictionary<string, object> pd ? pd : new()
            });
            return true;
        }

        private bool HandleAddGroupShape(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("shapesProperties", out var spObj) || spObj is not List<object> spList ||
                !payload.TryGetValue("groupShape", out var gsObj) || gsObj is not Dictionary<string, object> gsDict)
                return false;

            var ids = spList.Select(x => (x as Dictionary<string, object>)?["id"]?.ToString()).Where(id => id != null).ToHashSet();
            var nestedShapes = note.Content.Shapes.Where(s => s.Properties.TryGetValue("id", out var id) && ids.Contains(id?.ToString())).ToList();
            note.Content.Shapes.RemoveAll(s => s.Properties.TryGetValue("id", out var id) && ids.Contains(id?.ToString()));

            var groupShape = new Shape { Type = "Group", Properties = gsDict };
            groupShape.Properties["shapes"] = nestedShapes;
            note.Content.Shapes.Add(groupShape);
            return true;
        }

        private bool HandleRemoveGroupShape(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("groupShapeId", out var gsidObj))
                return false;

            var gsid = gsidObj.ToString();
            var groupIdx = note.Content.Shapes.FindIndex(s => s.Properties.TryGetValue("id", out var id) && id?.ToString() == gsid);
            if (groupIdx == -1)
                return false;

            var groupShape = note.Content.Shapes[groupIdx];
            if (!groupShape.Properties.TryGetValue("shapes", out var nestedObj) || nestedObj is not List<object> nestedList)
                return false;

            var nestedShapes = nestedList.Select(x =>
            {
                if (x is Shape s) return s;
                if (x is Dictionary<string, object> d)
                {
                    return new Shape
                    {
                        Type = d.TryGetValue("type", out var t) ? t.ToString()! : "Rectangle",
                        Properties = d.TryGetValue("properties", out var p) && p is Dictionary<string, object> pd ? pd : new()
                    };
                }
                return null;
            }).Where(s => s != null).Cast<Shape>().ToList();

            note.Content.Shapes.RemoveAt(groupIdx);
            note.Content.Shapes.AddRange(nestedShapes);
            return true;
        }

        private bool HandleShapeToLocal(Note note, Dictionary<string, object> payload)
        {
            if (!payload.TryGetValue("groupShape", out var gspObj) || gspObj is not Dictionary<string, object> gspDict ||
                !payload.TryGetValue("shapeProperties", out var shipObj) || shipObj is not Dictionary<string, object> shipDict)
                return false;

            var groupSid = gspDict.TryGetValue("id", out var gid) ? gid.ToString() : null;
            var targetSid = shipDict.TryGetValue("id", out var tid) ? tid.ToString() : null;

            if (groupSid == null || targetSid == null)
                return false;

            var groupShape = note.Content.Shapes.FirstOrDefault(s => s.Properties.TryGetValue("id", out var id) && id?.ToString() == groupSid);
            var targetIdx = note.Content.Shapes.FindIndex(s => s.Properties.TryGetValue("id", out var id) && id?.ToString() == targetSid);

            if (groupShape == null || targetIdx == -1)
                return false;

            var targetShape = note.Content.Shapes[targetIdx];
            note.Content.Shapes.RemoveAt(targetIdx);

            if (!groupShape.Properties.ContainsKey("shapes"))
                groupShape.Properties["shapes"] = new List<Shape>();

            if (groupShape.Properties["shapes"] is List<Shape> ls) ls.Add(targetShape);
            else if (groupShape.Properties["shapes"] is List<object> lo) lo.Add(targetShape);

            return true;
        }

        private void ApplyPropertiesUpdate(Dictionary<string, object> target, Dictionary<string, object> updates)
        {
            foreach (var kvp in updates)
            {
                if (kvp.Key == "style" && kvp.Value is Dictionary<string, object> newStyle && target.TryGetValue("style", out var oldStyleObj) && oldStyleObj is Dictionary<string, object> oldStyle)
                {
                    foreach (var styleKvp in newStyle)
                    {
                        oldStyle[styleKvp.Key] = styleKvp.Value;
                    }
                }
                else
                {
                    target[kvp.Key] = kvp.Value;

                    if (kvp.Key == "width" && target.TryGetValue("originalWidth", out var ow) && ow is double owd && owd != 0)
                    {
                        target["scaleX"] = Convert.ToDouble(kvp.Value) / owd;
                        target["horizontalInverted"] = Convert.ToDouble(kvp.Value) < 0;
                    }
                    if (kvp.Key == "height" && target.TryGetValue("originalHeight", out var oh) && oh is double ohd && ohd != 0)
                    {
                        target["scaleY"] = Convert.ToDouble(kvp.Value) / ohd;
                        target["verticallyInverted"] = Convert.ToDouble(kvp.Value) < 0;
                    }
                }
            }
        }

        private void ApplyDrawingPropertiesUpdate(Dictionary<string, object> target, Dictionary<string, object> updates)
        {
            foreach (var kvp in updates)
            {
                if (kvp.Key == "points" && kvp.Value is Dictionary<string, object> pointsDelta)
                {
                    if (pointsDelta.TryGetValue("lastPoint", out var lastPoint) && target.TryGetValue("points", out var pointsObj) && pointsObj is List<object> points)
                    {
                        points.Add(lastPoint);
                    }
                }
                else
                {
                    target[kvp.Key] = kvp.Value;
                }
            }
        }

        private static NoteResponse MapNoteResponse(Note note, ViewPosition? viewPosition)
        {
            return new NoteResponse
            {
                Id = note.Id,
                Title = note.Title,
                ParentFolderId = note.ParentFolderId,
                Content = new NoteContentResponse
                {
                    Drawings = note.Content.Drawings,
                    Shapes = note.Content.Shapes,
                },
                ViewPosition = viewPosition,
                ZoomScale = note.ZoomScale,
            };
        }
    }
}

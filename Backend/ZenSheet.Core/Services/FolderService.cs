using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using ZenSheet.Core.Constants;
using ZenSheet.Core.Interfaces;
using ZenSheet.Core.Models.Requests;
using ZenSheet.Core.Models.Responses;
using ZenSheet.Database.Contexts;
using ZenSheet.Database.Models;

namespace ZenSheet.Core.Services
{
    public class FolderService(MongoDbContext context, ILogger<FolderService> logger) : IFolderService
    {
        private readonly MongoDbContext _context = context;
        private readonly ILogger<FolderService> _logger = logger;

        public async Task<List<FolderResponse>> GetFoldersByParentAsync(string parentFolderId)
        {
            parentFolderId = NormalizeParentFolderId(parentFolderId);
            var filter = BuildFolderParentFilter(parentFolderId);

            var folders = await _context.Folders
                .Find(filter)
                .SortByDescending(f => f.CreatedAt)
                .ToListAsync();

            return [.. folders.Select(MapFolderResponse)];
        }

        public async Task CreateFolderAsync(CreateFolderRequest request)
        {
            var folder = new Folder
            {
                Name = request.Name,
                ParentFolderId = NormalizeParentFolderId(request.ParentFolderId),
                Color = request.Color
            };

            await _context.Folders.InsertOneAsync(folder);
            _logger.LogInformation("Folder created: {FolderId}, {FolderName}", folder.Id, request.Name);
            
            return;
        }

        public async Task UpdateFolderAsync(string folderId, UpdateFolderRequest request)
        {
            var updateBuilder = Builders<Folder>.Update;
            var updates = new List<UpdateDefinition<Folder>>();

            if (request.Name != null) updates.Add(updateBuilder.Set(f => f.Name, request.Name));
            if (request.Color != null) updates.Add(updateBuilder.Set(f => f.Color, request.Color));

            if (updates.Count == 0)
            {
                var folder = await _context.Folders.Find(f => f.Id == folderId).FirstOrDefaultAsync()
                    ?? throw new KeyNotFoundException($"Folder with ID {folderId} not found");
                return;
            }

            var result = await _context.Folders.FindOneAndUpdateAsync(
                f => f.Id == folderId,
                updateBuilder.Combine(updates),
                new FindOneAndUpdateOptions<Folder> { ReturnDocument = ReturnDocument.After }
            ) ?? throw new KeyNotFoundException($"Folder with ID {folderId} not found");
            
            return;
        }

        public async Task DeleteFolderAsync(string folderId)
        {
            var result = await _context.Folders.DeleteOneAsync(f => f.Id == folderId);

            if (result.DeletedCount == 0)
                throw new KeyNotFoundException($"Folder with ID {folderId} not found");

            await _context.Notes.DeleteManyAsync(n => n.ParentFolderId == folderId);

            var subfolders = await _context.Folders.Find(f => f.ParentFolderId == folderId).ToListAsync();
            foreach (var sub in subfolders)
            {
                await DeleteFolderAsync(sub.Id);
            }

            _logger.LogInformation("Folder and its children deleted: {FolderId}", folderId);
        }

        public async Task<List<HierarchyResponse>> GetHierarchyAsync()
        {
            var allFolders = await _context.Folders.Find(_ => true).ToListAsync();
            var allNotes = await _context.Notes.Find(_ => true).ToListAsync();

            var folderMap = allFolders.ToDictionary(f => f.Id, f => new HierarchyResponse
            {
                Id = f.Id,
                Name = f.Name,
                Color = f.Color,
                Subfolders = [],
                Notes = []
            });

            var rootFolders = new List<HierarchyResponse>();

            foreach (var folder in allFolders)
            {
                var node = folderMap[folder.Id];
                var parentId = folder.ParentFolderId;

                if (string.IsNullOrWhiteSpace(parentId)
                    || parentId == FolderConstants.RootFolderId
                    || !folderMap.TryGetValue(parentId, out HierarchyResponse? value))
                {
                    rootFolders.Add(node);
                }
                else
                {
                    value.Subfolders.Add(node);
                }
            }

            foreach (var note in allNotes)
            {
                var parentId = note.ParentFolderId;
                var noteNode = new NoteHierarchyResponse
                {
                    Id = note.Id,
                    Title = note.Title,
                    ParentFolderId = parentId
                };

                if (!string.IsNullOrWhiteSpace(parentId) && folderMap.TryGetValue(parentId, out HierarchyResponse? value))
                {
                    value.Notes.Add(noteNode);
                }
            }

            return rootFolders;
        }

        public async Task<List<NoteHierarchyResponse>> GetNotesByFolderAsync(string folderId)
        {
            folderId = NormalizeParentFolderId(folderId);
            var filter = BuildNoteParentFilter(folderId);

            return await _context.Notes
                .Find(filter)
                .SortByDescending(n => n.UpdatedAt)
                .Project(n => new NoteHierarchyResponse
                {
                    Id = n.Id,
                    Title = n.Title,
                    ParentFolderId = n.ParentFolderId
                })
                .ToListAsync();
        }

        public async Task<ResolvePathResponse> ResolvePathAsync(string[] pathSegments)
        {
            if (pathSegments == null || pathSegments.Length == 0)
                return new ResolvePathResponse();

            string currentParentId = FolderConstants.RootFolderId;
            string? foundFolderId = null;
            string? foundNoteId = null;

            for (int i = 0; i < pathSegments.Length; i++)
            {
                var segment = pathSegments[i];
                var isLast = i == pathSegments.Length - 1;

                var folderFilter = Builders<Folder>.Filter.And(
                    Builders<Folder>.Filter.Eq(f => f.Name, segment),
                    BuildFolderParentFilter(currentParentId)
                );

                var folder = await _context.Folders.Find(folderFilter).FirstOrDefaultAsync();

                if (folder != null)
                {
                    if (isLast)
                    {
                        foundFolderId = folder.Id;
                        break;
                    }
                    currentParentId = folder.Id;
                    continue;
                }

                if (isLast)
                {
                    var noteFilter = Builders<Note>.Filter.And(
                        Builders<Note>.Filter.Eq(n => n.Title, segment),
                        BuildNoteParentFilter(currentParentId)
                    );

                    var note = await _context.Notes.Find(noteFilter).FirstOrDefaultAsync();
                    if (note != null)
                    {
                        foundNoteId = note.Id;
                        foundFolderId = note.ParentFolderId;
                        break;
                    }
                }

                return new ResolvePathResponse();
            }

            return new ResolvePathResponse
            {
                FolderId = foundFolderId,
                NoteId = foundNoteId
            };
        }


        private static string NormalizeParentFolderId(string? parentFolderId)
        {
            return string.IsNullOrWhiteSpace(parentFolderId)
                ? FolderConstants.RootFolderId
                : parentFolderId;
        }

        private static FilterDefinition<Folder> BuildFolderParentFilter(string parentFolderId)
        {
            return parentFolderId == FolderConstants.RootFolderId
                ? Builders<Folder>.Filter.Or(
                    Builders<Folder>.Filter.Eq(f => f.ParentFolderId, FolderConstants.RootFolderId),
                    Builders<Folder>.Filter.Eq(f => f.ParentFolderId, null),
                    Builders<Folder>.Filter.Eq(f => f.ParentFolderId, "")
                )
                : Builders<Folder>.Filter.Eq(f => f.ParentFolderId, parentFolderId);
        }

        private static FilterDefinition<Note> BuildNoteParentFilter(string folderId)
        {
            return folderId == FolderConstants.RootFolderId
                ? Builders<Note>.Filter.Or(
                    Builders<Note>.Filter.Eq(n => n.ParentFolderId, FolderConstants.RootFolderId),
                    Builders<Note>.Filter.Eq(n => n.ParentFolderId, null),
                    Builders<Note>.Filter.Eq(n => n.ParentFolderId, "")
                )
                : Builders<Note>.Filter.Eq(n => n.ParentFolderId, folderId);
        }

        private static FolderResponse MapFolderResponse(Folder folder)
        {
            return new FolderResponse
            {
                Id = folder.Id,
                Name = folder.Name,
                ParentFolderId = folder.ParentFolderId,
                Color = folder.Color,
            };
        }
    }
}

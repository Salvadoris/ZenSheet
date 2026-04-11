using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using ZenSheet.Database.Enums;
using ZenSheet.Core.Interfaces;
using ZenSheet.Core.Models.Hub;

namespace ZenSheet.Api.Hubs
{
    public class CanvasHub(IActionService actionService, IClientSessionService sessionService, ILogger<CanvasHub> logger) : Hub
    {
        private readonly IActionService _actionService = actionService;
        private readonly IClientSessionService _sessionService = sessionService;
        private readonly ILogger<CanvasHub> _logger = logger;

        private static readonly ConcurrentDictionary<string, string> ConnectionToClient = new();

        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> NoteConnections = new();

        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, CursorPosition>> NoteCursors = new();

        private static readonly ConcurrentDictionary<string, PresenceInfo> GlobalPresence = new();

        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, List<string>>> NoteSelections = new();

        public async Task InitialRegisterAsync(string clientId, string username)
        {
            var connectionId = Context.ConnectionId;
            ConnectionToClient[connectionId] = clientId;
            
            GlobalPresence.AddOrUpdate(clientId,
                _ => new PresenceInfo
                {
                    ClientId = clientId,
                    Username = username,
                    NoteId = null!,
                    LastUpdate = DateTime.UtcNow
                },
                (_, existing) => new PresenceInfo
                {
                    ClientId = existing.ClientId,
                    Username = username,
                    NoteId = existing.NoteId,
                    CursorPosition = existing.CursorPosition,
                    LastUpdate = DateTime.UtcNow
                });

            _logger.LogInformation($"Registered: {clientId} (ConnID: {connectionId}) as {username}");
            
            // Broadcast initial presence list to everyone
            await Clients.All.SendAsync("PresenceUpdate", GetGlobalPresenceList());
        }

        private List<PresenceInfo> GetGlobalPresenceList()
        {
            return [.. GlobalPresence.Values];
        }

        public async Task JoinNoteAsync(string noteId, string clientId, string clientSecret, string username)
        {
            if (!await _sessionService.ValidateSessionAsync(clientId, clientSecret))
            {
                _logger.LogWarning($"Unauthorized join attempt: Client {clientId} for note {noteId}");
                await Clients.Caller.SendAsync("AuthError", "Invalid client credentials");
                return;
            }

            var connectionId = Context.ConnectionId;
            ConnectionToClient[connectionId] = clientId;

            await CleanupConnectionFromNotesAsync(connectionId, clientId, noteId);

            await Groups.AddToGroupAsync(connectionId, noteId);

            var noteConnections = NoteConnections.GetOrAdd(noteId, _ => new ConcurrentDictionary<string, byte>());
            noteConnections.TryAdd(connectionId, 0);

            GlobalPresence.AddOrUpdate(clientId,
                _ => new PresenceInfo
                {
                    ClientId = clientId,
                    Username = username,
                    NoteId = noteId,
                    LastUpdate = DateTime.UtcNow
                },
                (_, existing) => new PresenceInfo
                {
                    ClientId = existing.ClientId,
                    Username = username,
                    NoteId = noteId,
                    CursorPosition = existing.CursorPosition,
                    LastUpdate = DateTime.UtcNow
                });

            var currentVersion = await _actionService.GetCurrentVersionAsync(noteId);

            _logger.LogInformation($"PersistentClient={clientId} (ConnID: {connectionId}) note {noteId} v{currentVersion}");

            await Clients.Client(connectionId).SendAsync("VersionSync", currentVersion);

            await Clients.Client(connectionId).SendAsync("PresenceUpdate", GetGlobalPresenceList());

            int countInNote = NoteConnections.TryGetValue(noteId, out var conns) ? conns.Count : 0;

            await Clients.GroupExcept(noteId, connectionId)
                .SendAsync("ClientJoined", clientId, countInNote);

            await Clients.All.SendAsync("PresenceUpdate", GetGlobalPresenceList());

            var cursors = new List<object>();

            if (NoteCursors.TryGetValue(noteId, out var cursorDict))
            {
                cursors.AddRange(
                    cursorDict
                        .Where(kvp => kvp.Key != clientId)
                        .Select(kvp => new
                        {
                            clientId = kvp.Key,
                            cursorPosition = kvp.Value,
                            noteId
                        })
                );
            }

            if (cursors.Count != 0)
            {
                await Clients.Client(connectionId).SendAsync("InitialCursors", cursors);
            }
        }

        public async Task<object> SendActionAsync(string noteId, ActionType actionType, Dictionary<string, object> payload)
        {
            var connectionId = Context.ConnectionId;
            if (!ConnectionToClient.TryGetValue(connectionId, out var clientId))
            {
                await Clients.Caller.SendAsync("AuthError", "You must join a note with valid credentials first.");
                return null!;
            }

            try
            {
                var action = await _actionService.SaveActionAsync(noteId, actionType, payload, clientId);

                var responsePayload = new
                {
                    actionType = action.ActionType,
                    payload = action.Payload,
                    version = action.Version,
                    clientId = action.ClientId
                };

                await Clients.OthersInGroup(noteId).SendAsync(
                    "ActionReceived",
                    responsePayload
                );

                return new
                {
                    actionId = action.Id.ToString(),
                    noteId = action.NoteId,
                    actionType = action.ActionType,
                    payload = action.Payload,
                    version = action.Version,
                    clientId = action.ClientId,
                    timestamp = action.Timestamp
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to process action for note {noteId}");
                await Clients.Caller.SendAsync("ActionError", ex.Message);
                return null!;
            }
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"Connected: ConnID {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;
            
            if (!ConnectionToClient.TryGetValue(connectionId, out string? clientId))
            {
                clientId = connectionId;
            }

            _logger.LogInformation($"Disconnected: PersistentClient={clientId} (ConnID: {connectionId})");

            await CleanupConnectionFromNotesAsync(connectionId, clientId!);

            ConnectionToClient.TryRemove(connectionId, out _);

            if (clientId != null && !ConnectionToClient.Values.Any(v => v == clientId))
            {
                GlobalPresence.TryRemove(clientId, out _);
            }

            await Clients.All.SendAsync("PresenceUpdate", GetGlobalPresenceList());

            await base.OnDisconnectedAsync(exception);
        }

        private async Task CleanupConnectionFromNotesAsync(string connectionId, string clientId, string? excludeNoteId = null)
        {
            var notesToClean = NoteConnections
                .Where(kvp => kvp.Value.ContainsKey(connectionId))
                .Select(kvp => kvp.Key)
                .Where(noteId => noteId != excludeNoteId)
                .ToList();

            foreach (var noteId in notesToClean)
            {
                var (remainingClientCount, isLastConnectionForClient) = RemoveConnectionFromNote(connectionId, clientId, noteId);

                bool hadCursor = false;
                if (isLastConnectionForClient)
                    hadCursor = RemoveCursor(clientId, noteId);

                await NotifyClientLeft(connectionId, clientId, noteId, remainingClientCount, hadCursor);
            }
        }

        private static (int RemainingClientCount, bool IsLastConnectionForClient) RemoveConnectionFromNote(
            string connectionId, string clientId, string noteId)
        {
            if (!NoteConnections.TryGetValue(noteId, out var noteConns))
                return (0, true);

            noteConns.TryRemove(connectionId, out _);

            int remainingClientCount = ConnectionToClient
                .Where(kvp => noteConns.ContainsKey(kvp.Key))
                .Select(kvp => kvp.Value)
                .Distinct()
                .Count();

            bool isLastConnectionForClient = !ConnectionToClient
                .Where(kvp => kvp.Key != connectionId && noteConns.ContainsKey(kvp.Key))
                .Any(kvp => kvp.Value == clientId);

            if (noteConns.IsEmpty)
                NoteConnections.TryRemove(noteId, out _);

            return (remainingClientCount, isLastConnectionForClient);
        }

        private static bool RemoveCursor(string clientId, string noteId)
        {
            if (!NoteCursors.TryGetValue(noteId, out var cursorDict))
                return false;

            bool removed = cursorDict.TryRemove(clientId, out _);

            if (cursorDict.IsEmpty)
                NoteCursors.TryRemove(noteId, out _);

            return removed;
        }

        private async Task NotifyClientLeft(
            string connectionId, string clientId, string noteId, int remainingClientCount, bool hadCursor)
        {
            await Clients.Group(noteId)
                .SendAsync("ClientLeft", clientId, remainingClientCount);

            if (hadCursor)
                await Clients.Group(noteId).SendAsync("CursorRemoved", clientId);

            await Groups.RemoveFromGroupAsync(connectionId, noteId);
        }

        /// <summary>
        /// Called when client requests to sync, sends all actions since a specific version.
        /// Useful for catching up after temporary disconnection.
        /// </summary>
        public async Task RequestActionsSinceAsync(string noteId, long lastKnownVersion)
        {
            var connectionId = Context.ConnectionId;
            if (!ConnectionToClient.TryGetValue(connectionId, out var clientId))
            {
                clientId = connectionId;
            }

            try
            {
                var actions = await _actionService.GetActionsSinceAsync(noteId, lastKnownVersion);

                await Clients.Client(connectionId).SendAsync("ActionSync", actions);

                _logger.LogInformation($"Sent {actions.Count} actions to {clientId} for note {noteId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to sync actions for note {noteId}");
                await Clients.Client(clientId).SendAsync("SyncError", ex.Message);
            }
        }

        public async Task UpdateCursorPositionAsync(string noteId, CursorPosition cursorPosition)
        {
            var connectionId = Context.ConnectionId;
            if (!ConnectionToClient.TryGetValue(connectionId, out var clientId))
            {
                return;
            }

            try
            {
                var dict = NoteCursors.GetOrAdd(noteId, _ => new ConcurrentDictionary<string, CursorPosition>());
                dict[clientId] = cursorPosition;

                GlobalPresence.AddOrUpdate(clientId,
                    _ => new PresenceInfo { ClientId = clientId, Username = "Anonymous", NoteId = noteId, CursorPosition = cursorPosition, LastUpdate = DateTime.UtcNow },
                    (_, existing) => new PresenceInfo
                    {
                        ClientId = existing.ClientId,
                        Username = existing.Username,
                        NoteId = noteId,
                        CursorPosition = cursorPosition,
                        LastUpdate = DateTime.UtcNow
                    });

            await Clients.OthersInGroup(noteId).SendAsync(
                "CursorPositionUpdate",
                new RemoteCursorPosition
                {
                    ClientId = clientId,
                    CursorPosition = cursorPosition
                }
            );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update cursor position for note {noteId}");
            }
        }

        public async Task UpdateUsernameAsync(string username)
        {
            var connectionId = Context.ConnectionId;
            if (!ConnectionToClient.TryGetValue(connectionId, out var clientId)) return;

            GlobalPresence.AddOrUpdate(clientId,
                _ => new PresenceInfo
                {
                    ClientId = clientId,
                    Username = username,
                    NoteId = null!,
                    LastUpdate = DateTime.UtcNow
                },
                (_, existing) => new PresenceInfo
                {
                    ClientId = existing.ClientId,
                    Username = username,
                    NoteId = existing.NoteId,
                    CursorPosition = existing.CursorPosition,
                    LastUpdate = DateTime.UtcNow
                });

            await Clients.All.SendAsync("PresenceUpdate", GetGlobalPresenceList());
        }

        public async Task NotifyHierarchyChanged(string affectedFolderId)
        {
            try
            {
                await Clients.All.SendAsync("HierarchyChanged", affectedFolderId);
                _logger.LogInformation("Hierarchy change notification broadcasted (affectedFolder: {FolderId}).", affectedFolderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast hierarchy change notification.");
            }
        }

        public async Task UpdateSelectionAsync(string noteId, List<string> shapeIdList)
        {
            var connectionId = Context.ConnectionId;
            if (!ConnectionToClient.TryGetValue(connectionId, out var clientId)) return;

            var dict = NoteSelections.GetOrAdd(noteId, _ => new ConcurrentDictionary<string, List<string>>());
            dict[clientId] = shapeIdList;

            await Clients.OthersInGroup(noteId).SendAsync("SelectionUpdated", clientId, shapeIdList);
        }
    }
}
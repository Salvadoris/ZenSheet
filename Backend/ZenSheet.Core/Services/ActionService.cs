using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System.Collections.Concurrent;
using ZenSheet.Database.Enums;
using ZenSheet.Core.Interfaces;
using ZenSheet.Database.Contexts;
using ZenSheet.Database.Models;

namespace ZenSheet.Core.Services
{
    public class ActionService(MongoDbContext context, INoteService noteService, ILogger<ActionService> logger) : IActionService
    {
        private readonly MongoDbContext _context = context;
        private readonly INoteService _noteService = noteService;
        private readonly ILogger<ActionService> _logger = logger;

        private static readonly ConcurrentDictionary<string, long> _versionCache = new();
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> _versionLocks = new();

        public async Task<CanvasAction> SaveActionAsync(
            string noteId,
            ActionType actionType,
            Dictionary<string, object> payload,
            string clientId)
        {
            var version = await GetNextVersionAsync(noteId);

            var sanitizedPayload = Utils.SerializationUtils.SanitizeDictionary(payload!);

            var action = new CanvasAction
            {
                NoteId = noteId,
                ActionType = actionType,
                Payload = sanitizedPayload!,
                ClientId = clientId,
                Version = version,
                Timestamp = DateTime.UtcNow
            };

            _ = Task.Run(async () =>
            {
                try
                {
                    await _context.CanvasActions.InsertOneAsync(action);
                    await _noteService.ApplyActionAsync(noteId, action);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to persist/apply action for note {noteId} v{action.Version}");
                }
            });

            return action;
        }

        public async Task<List<CanvasAction>> GetActionsAsync(string noteId, long fromVersion = 0)
        {
            var filter = Builders<CanvasAction>.Filter.And(
                Builders<CanvasAction>.Filter.Eq(a => a.NoteId, noteId),
                Builders<CanvasAction>.Filter.Gte(a => a.Version, fromVersion)
            );

            return await _context.CanvasActions
                .Find(filter)
                .SortBy(a => a.Version)
                .ToListAsync();
        }


        public async Task<long> GetCurrentVersionAsync(string noteId)
        {
            if (_versionCache.TryGetValue(noteId, out var cachedVersion))
            {
                return cachedVersion;
            }

            try
            {
                var action = await _context.CanvasActions
                .Find(a => a.NoteId == noteId)
                .SortByDescending(a => a.Version)
                .FirstOrDefaultAsync();

                var version = action?.Version ?? 0;
                _versionCache.TryAdd(noteId, version);
                return version;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get current version for note {noteId}");
                throw;
            }
        }

        private async Task<long> GetNextVersionAsync(string noteId)
        {
            var versionLock = _versionLocks.GetOrAdd(noteId, static _ => new SemaphoreSlim(1, 1));
            await versionLock.WaitAsync();

            try
            {
                if (!_versionCache.TryGetValue(noteId, out var currentVersion))
                {
                    currentVersion = await GetCurrentVersionAsync(noteId);
                }

                var nextVersion = currentVersion + 1;
                _versionCache[noteId] = nextVersion;
                return nextVersion;
            }
            finally
            {
                versionLock.Release();
            }
        }

        /// <summary>
        /// Gets actions that occurred after a specific version.
        /// Used for delta synchronization.
        /// </summary>
        public async Task<List<CanvasAction>> GetActionsSinceAsync(string noteId, long version)
        {
            return await GetActionsAsync(noteId, version + 1);
        }

        public async Task CleanupActionsAsync(string noteId, long currentVersion)
        {
            const int buffer = 100;
            var threshold = currentVersion - buffer;

            if (threshold <= 0) return;

            _ = Task.Run(async () =>
            {
                try
                {
                    var filter = Builders<CanvasAction>.Filter.And(
                        Builders<CanvasAction>.Filter.Eq(a => a.NoteId, noteId),
                        Builders<CanvasAction>.Filter.Lt(a => a.Version, threshold)
                    );

                    var result = await _context.CanvasActions.DeleteManyAsync(filter);
                    if (result.DeletedCount > 0)
                    {
                        _logger.LogInformation(
                            "Cleaned up {DeletedCount} old actions for note {NoteId} (kept up to v{Threshold})",
                            result.DeletedCount,
                            noteId,
                            threshold);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to cleanup actions for note {noteId}");
                }
            });

            await Task.CompletedTask;
        }
    }
}

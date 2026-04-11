using ZenSheet.Database.Enums;
using ZenSheet.Database.Models;

namespace ZenSheet.Core.Interfaces
{
    public interface IActionService
    {
        Task<CanvasAction> SaveActionAsync(string noteId, ActionType actionType, Dictionary<string, object> payload, string clientId);
        Task<List<CanvasAction>> GetActionsAsync(string noteId, long fromVersion = 0);
        Task<long> GetCurrentVersionAsync(string noteId);
        Task<List<CanvasAction>> GetActionsSinceAsync(string noteId, long version);
        Task CleanupActionsAsync(string noteId, long currentVersion);
    }
}

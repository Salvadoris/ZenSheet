using ZenSheet.Core.Models;
using ZenSheet.Core.Models.Requests;
using ZenSheet.Core.Models.Responses;

namespace ZenSheet.Core.Interfaces
{
    public interface IFolderService
    {
        Task<List<FolderResponse>> GetFoldersByParentAsync(string parentFolderId);
        Task CreateFolderAsync(CreateFolderRequest request);
        Task UpdateFolderAsync(string folderId, UpdateFolderRequest request);
        Task DeleteFolderAsync(string folderId);
        Task<List<HierarchyResponse>> GetHierarchyAsync();
        Task<List<NoteHierarchyResponse>> GetNotesByFolderAsync(string folderId);
        Task<ResolvePathResponse> ResolvePathAsync(string[] pathSegments);
    }
}

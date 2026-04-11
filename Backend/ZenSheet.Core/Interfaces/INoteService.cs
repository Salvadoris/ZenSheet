using ZenSheet.Core.Models.Requests;
using ZenSheet.Core.Models.Responses;
using ZenSheet.Database.Models;

namespace ZenSheet.Core.Interfaces
{
    public interface INoteService
    {
        Task<string> CreateNoteAsync(CreateNoteRequest request);
        Task<NoteResponse> GetNoteAsync(string noteId, string? clientId = null);
        Task<NoteResponse> UpdateNoteTitleAsync(string noteId, UpdateNoteTitleRequest request);
        Task<NoteResponse> UpdateNoteContentAsync(string noteId, UpdateNoteContentRequest request);
        Task DeleteNoteAsync(string noteId);
        Task ApplyActionAsync(string noteId, CanvasAction action);
        Task<NoteResponse> InsertNoteFromDB(string noteId, string destinationFolderId);
        Task<NoteResponse> InsertNoteFromLocal(InsertNoteRequest request);
    }
}

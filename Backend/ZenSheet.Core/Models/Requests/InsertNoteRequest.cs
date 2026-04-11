using ZenSheet.Core.Models.Responses;
using ZenSheet.Database.Models;

namespace ZenSheet.Core.Models.Requests
{
    public class InsertNoteRequest
    {
        public required string DestinationFolderId { get; set; }
        public required NoteDataRequest NoteData { get; set; }
    }

    public class NoteDataRequest
    {
        public required string Title { get; set; }

        public required NoteContent Content { get; set; }

        public Dictionary<string, ViewPosition> ViewPositions { get; set; } = [];
        
        public required float ZoomScale { get; set; }

        public required DateTime UpdatedAt { get; set; }

        public required DateTime CreatedAt { get; set; }
    }
}

using ZenSheet.Database.Models;

namespace ZenSheet.Core.Models.Requests
{
    public class UpdateNoteContentRequest
    {
        public NoteContent? Content { get; set; }

        public float? ZoomScale { get; set; }

        public float[]? ViewPosition { get; set; }

        public string? ClientId { get; set; }

        public long? Version { get; set; }
    }
}

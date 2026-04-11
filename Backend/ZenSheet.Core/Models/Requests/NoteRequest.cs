using ZenSheet.Core.Models.Responses;
using ZenSheet.Database.Models;

namespace ZenSheet.Core.Models.Requests;

public class NoteRequest
{
    public required string ParentFolderId { get; set; }

    public required string Title { get; set; }

    public required NoteContentRequest Content { get; set; }

    public ViewPosition? ViewPosition { get; set; }

    public required float ZoomScale { get; set; }
}

public class NoteContentRequest
{
    public List<Shape> Shapes { get; set; } = [];
}
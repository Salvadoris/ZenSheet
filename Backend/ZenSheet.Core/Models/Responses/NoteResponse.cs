using ZenSheet.Database.Models;

namespace ZenSheet.Core.Models.Responses;

public class NoteResponse
{
    public required string Id { get; set; }

    public required string ParentFolderId { get; set; }

    public required string Title { get; set; }

    public required NoteContentResponse Content { get; set; }

    public ViewPosition? ViewPosition { get; set; }

    public required float ZoomScale { get; set; }
}

public class NoteContentResponse
{
    public List<Drawing> Drawings { get; set; } = [];

    public List<Shape> Shapes { get; set; } = [];
}

public class ViewPosition
{
    public double X { get; set; }

    public double Y { get; set; }
}

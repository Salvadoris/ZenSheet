namespace ZenSheet.Core.Models.Responses;

public class NoteVersionResponse
{
    public required string NoteId { get; set; }

    public required long Version { get; set; }
}

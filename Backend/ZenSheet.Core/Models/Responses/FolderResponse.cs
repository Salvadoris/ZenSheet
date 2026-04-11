namespace ZenSheet.Core.Models.Responses;

public class FolderResponse
{
    public required string Id { get; set; }

    public required string Name { get; set; }

    public required string ParentFolderId { get; set; }

    public string? Color { get; set; }
}

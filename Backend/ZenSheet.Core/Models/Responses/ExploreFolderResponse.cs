namespace ZenSheet.Core.Models.Responses;

public class ExploreFolderResponse
{
    public required string FolderId { get; set; }

    public required List<FolderResponse> Folders { get; set; }

    public required List<NoteHierarchyResponse> Notes { get; set; }
}

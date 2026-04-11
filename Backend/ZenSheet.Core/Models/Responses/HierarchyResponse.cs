namespace ZenSheet.Core.Models.Responses
{
    public class HierarchyResponse
    {
        public required string Id { get; set; }

        public required string Name { get; set; }

        public string? Color { get; set; }

        public List<HierarchyResponse> Subfolders { get; set; } = new();

        public List<NoteHierarchyResponse> Notes { get; set; } = new();
    }

    public class NoteHierarchyResponse
    {
        public required string Id { get; set; }

        public required string Title { get; set; }

        public string? ParentFolderId { get; set; }
    }
}

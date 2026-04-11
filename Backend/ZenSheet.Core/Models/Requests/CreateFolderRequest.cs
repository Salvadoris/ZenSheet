namespace ZenSheet.Core.Models.Requests
{
    public class CreateFolderRequest
    {
        public required string Name { get; set; }

        public string? ParentFolderId { get; set; }

        public string? Color { get; set; }
    }
}

namespace ZenSheet.Core.Models.Requests
{
    public class CreateNoteRequest
    {
        public required string Title { get; set; }

        public required string ParentFolderId { get; set; }
    }

}
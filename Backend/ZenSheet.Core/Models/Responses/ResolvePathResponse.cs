namespace ZenSheet.Core.Models.Responses
{
    public class ResolvePathResponse
    {
        public string? FolderId { get; set; }
        public string? NoteId { get; set; }
        
        public bool Found => FolderId != null || NoteId != null;
    }
}

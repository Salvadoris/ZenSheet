namespace ZenSheet.Core.Models.Hub
{
    public class PresenceInfo
    {
        public required string ClientId { get; set; }

        public required string Username { get; set; }
        
        public required string NoteId { get; set; } = string.Empty;
        
        public CursorPosition CursorPosition { get; set; } = new CursorPosition();
        
        public DateTime LastUpdate { get; set; }
    }
}

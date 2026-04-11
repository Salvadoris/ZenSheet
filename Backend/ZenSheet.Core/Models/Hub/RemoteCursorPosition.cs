namespace ZenSheet.Core.Models.Hub
{
    public record RemoteCursorPosition
    {
        public string ClientId { get; set; } = string.Empty;
        public CursorPosition CursorPosition { get; set; } = new CursorPosition();
    }
}

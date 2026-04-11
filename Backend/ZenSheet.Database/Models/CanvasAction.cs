using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ZenSheet.Database.Enums;

namespace ZenSheet.Database.Models
{
    [BsonIgnoreExtraElements]
    public class CanvasAction
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public ObjectId Id { get; set; }

        [BsonElement("noteId")]
        public string NoteId { get; set; } = string.Empty;

        [BsonElement("actionType")]
        [BsonRepresentation(BsonType.String)]
        public ActionType ActionType { get; set; }

        [BsonElement("payload")]
        public Dictionary<string, object> Payload { get; set; }

        [BsonElement("clientId")]
        public string ClientId { get; set; } = string.Empty;

        [BsonElement("version")]
        public long Version { get; set; }

        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; }

        public CanvasAction()
        {
            Timestamp = DateTime.UtcNow;
            Payload = [];
        }
    }

    [BsonIgnoreExtraElements]
    public class NoteWithActions : Note
    {
        [BsonElement("currentVersion")]
        public long CurrentVersion { get; set; } = 0;

        [BsonElement("actionIds")]
        [BsonIgnoreIfNull]
        public List<string> ActionIds { get; set; } = [];
    }
}

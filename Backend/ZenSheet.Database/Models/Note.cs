using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ZenSheet.Database.Models
{
    [BsonIgnoreExtraElements]
    public class Drawing
    {
        [BsonElement("type")]
        public string Type { get; set; } = string.Empty;

        [BsonElement("properties")]
        public Dictionary<string, object> Properties { get; set; } = [];
    }

    [BsonIgnoreExtraElements]
    public class Shape
    {
        [BsonElement("type")]
        public string Type { get; set; } = string.Empty;

        [BsonElement("properties")]
        public Dictionary<string, object> Properties { get; set; } = [];
    }

    [BsonIgnoreExtraElements]
    public class Position
    {
        [BsonElement("x")]
        public double X { get; set; }

        [BsonElement("y")]
        public double Y { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class Size
    {
        [BsonElement("width")]
        public double Width { get; set; }

        [BsonElement("height")]
        public double Height { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class NoteContent
    {
        [BsonElement("drawings")]
        public List<Drawing> Drawings { get; set; } = [];

        [BsonElement("shapes")]
        public List<Shape> Shapes { get; set; } = [];
    }

    [BsonIgnoreExtraElements]
    public class Note
    {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        public string Id { get; set; }

        [BsonElement("parentFolderId")]
        public string ParentFolderId { get; set; }

        [BsonElement("title")]
        public string Title { get; set; }

        [BsonElement("content")]
        public NoteContent Content { get; set; }

        [BsonElement("viewPositions")]
        public Dictionary<string, float[]> ViewPositions { get; set; } = [];

        [BsonElement("zoomScale")]
        [BsonIgnoreIfNull]
        public float ZoomScale { get; set; }


        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }

        public Note()
        {
            Id = ObjectId.GenerateNewId().ToString();
            ParentFolderId = string.Empty;
            Title = "New Note";
            Content = new NoteContent();
            ZoomScale = 1.0f;
            ViewPositions = [];
            UpdatedAt = DateTime.UtcNow;
            CreatedAt = DateTime.UtcNow;
        }
    }

    [BsonIgnoreExtraElements]
    public class Folder
    {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        public string Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; }

        [BsonElement("parentFolderId")]
        [BsonIgnoreIfNull]
        public string ParentFolderId { get; set; } = string.Empty;

        [BsonElement("color")]
        [BsonIgnoreIfNull]
        public string? Color { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }

        public Folder()
        {
            Id = ObjectId.GenerateNewId().ToString();
            Name = "New Folder";
            ParentFolderId = string.Empty;
            CreatedAt = DateTime.UtcNow;
        }
    }
}

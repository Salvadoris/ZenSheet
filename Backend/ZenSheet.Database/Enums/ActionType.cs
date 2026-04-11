using System.Text.Json.Serialization;

namespace ZenSheet.Database.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum ActionType
    {
        AddShapes,
        RemoveShapes,
        ChangeShapesProperties,
        AddDrawings,
        RemoveDrawings,
        ChangeDrawingProperties,
        DrawingToShape,
        AddGroupShape,
        RemoveGroupShape,
        ShapeToLocal
    }
}

using System.Text.Json;

namespace ZenSheet.Core.Utils
{
    public static class SerializationUtils
    {
        // Placeholder for now
        public static object? ConvertJsonElement(object? obj)
        {
            if (obj is JsonElement element)
            {
                switch (element.ValueKind)
                {
                    case JsonValueKind.String:
                        return element.GetString();
                    case JsonValueKind.Number:
                        if (element.TryGetInt64(out long l)) return l;
                        return element.GetDouble();
                    case JsonValueKind.True:
                        return true;
                    case JsonValueKind.False:
                        return false;
                    case JsonValueKind.Null:
                        return null;
                    case JsonValueKind.Object:
                        var dict = new Dictionary<string, object?>();
                        foreach (var prop in element.EnumerateObject())
                        {
                            dict[prop.Name] = ConvertJsonElement(prop.Value);
                        }
                        return dict;
                    case JsonValueKind.Array:
                        var list = new List<object?>();
                        foreach (var item in element.EnumerateArray())
                        {
                            list.Add(ConvertJsonElement(item));
                        }
                        return list;
                    default:
                        return element.GetRawText();
                }
            }
            return obj;
        }

        public static Dictionary<string, object?> SanitizeDictionary(Dictionary<string, object?>? dict)
        {
            if (dict == null) return [];

            return dict.ToDictionary(
                kvp => kvp.Key,
                kvp => ConvertJsonElement(kvp.Value)
            );
        }
    }
}

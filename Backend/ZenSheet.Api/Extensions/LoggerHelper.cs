using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ZenSheet.Api.Extensions
{
    public static partial class LoggerExtensions
    {
        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            WriteIndented = false
        };

        [LoggerMessage(
            Level = LogLevel.Information,
            Message = "=> {Method}()")]
        private static partial void LogMethodCallCore(
            ILogger logger,
            string method);

        [LoggerMessage(
            Level = LogLevel.Information,
            Message = "=> {Method}({Parameters})")]
        private static partial void LogMethodCallWithParamsCore(
            ILogger logger,
            string method,
            string parameters);

        public static void LogMethodCall(
            this ILogger logger,
            [CallerMemberName] string methodName = "")
        {
            LogMethodCallCore(logger, methodName);
        }

        public static void LogMethodCall(
            this ILogger logger,
            object parameters,
            [CallerMemberName] string methodName = "")
        {
            try
            {
                var serializedParams = JsonSerializer.Serialize(parameters, _jsonOptions);
                LogMethodCallWithParamsCore(logger, methodName, serializedParams);
            }
            catch
            {
                LogMethodCallWithParamsCore(logger, methodName, "? [Serialization Failed]");
            }
        }
    }
}


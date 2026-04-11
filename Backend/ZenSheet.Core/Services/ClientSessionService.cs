using System.Collections.Concurrent;
using ZenSheet.Core.Interfaces;
using ZenSheet.Core.Models.Hub;

namespace ZenSheet.Core.Services
{
    public class ClientSessionService : IClientSessionService
    {
        private static readonly ConcurrentDictionary<string, ClientSession> _sessions = new();
        
        public Task<bool> ValidateSessionAsync(string clientId, string clientSecret)
        {
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                return Task.FromResult(false);
            }

            if (_sessions.TryGetValue(clientId, out var existingSession))
            {
                return Task.FromResult(existingSession.ClientSecret == clientSecret);
            }

            var newSession = new ClientSession
            {
                ClientId = clientId,
                ClientSecret = clientSecret,
                CreatedAt = DateTime.UtcNow
            };

            return Task.FromResult(_sessions.TryAdd(clientId, newSession));
        }
    }
}

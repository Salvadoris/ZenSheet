namespace ZenSheet.Core.Interfaces
{
    public interface IClientSessionService
    {
        Task<bool> ValidateSessionAsync(string clientId, string clientSecret);
    }
}

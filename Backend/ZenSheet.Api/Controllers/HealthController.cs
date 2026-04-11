using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using ZenSheet.Api.Extensions;
using ZenSheet.Database.Contexts;

namespace ZenSheet.Api.Controllers
{
    public class HealthController(MongoDbContext dbContext, ILogger<HealthController> logger) : HomeController
    {
        private readonly MongoDbContext _dbContext = dbContext;
        private readonly ILogger<HealthController> _logger = logger;

        [HttpGet]
        public async Task<IActionResult> GetHealth()
        {
            _logger.LogMethodCall();
            try
            {
                var pingCommand = new BsonDocument("ping", 1);
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await _dbContext.Notes.Database.RunCommandAsync<BsonDocument>(pingCommand, cancellationToken: cts.Token);

                return Ok(new { status = "Healthy", database = "Connected" });
            }
            catch
            {
                _logger.LogError("Database health check failed");
                return StatusCode(503, new { status = "Degraded", database = "Unreachable" });
            }
        }
    }
}

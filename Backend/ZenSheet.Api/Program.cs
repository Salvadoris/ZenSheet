using MongoDB.Driver;
using Scalar.AspNetCore;
using ZenSheet.Api.Hubs;
using ZenSheet.Core.Interfaces;
using ZenSheet.Core.Services;
using ZenSheet.Database.Contexts;
using DotNetEnv;

try
{
    Env.TraversePath().Load();
    var builder = WebApplication.CreateBuilder(args);

    // --- Logging ---
    builder.Logging.ClearProviders();
    builder.Logging.AddConsole();
    builder.Logging.AddDebug();
    builder.Logging.SetMinimumLevel(LogLevel.Information);

    // --- Services ---
    var services = builder.Services;
    services.AddControllers();
    services.AddOpenApi();
    services.AddSignalR(options =>
    {
        options.EnableDetailedErrors = true;
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(15);
        options.KeepAliveInterval = TimeSpan.FromSeconds(7);
    });

    // --- Services & Interfaces ---
    services.AddScoped<IActionService, ActionService>();
    services.AddScoped<INoteService, NoteService>();
    services.AddScoped<IFolderService, FolderService>();
    services.AddSingleton<IClientSessionService, ClientSessionService>();

    // --- Database WIP ---
    var mongoHost = builder.Configuration["MONGO_HOST"] ?? "localhost";
    var mongoPort = builder.Configuration["MONGO_PORT"] ?? "27017";
    var mongoConnectionString = $"mongodb://{mongoHost}:{mongoPort}";

    var mongoDatabaseName = builder.Configuration["MONGO_DB"] ?? "ZenSheet";
    var mongoUser = builder.Configuration["MONGO_ROOT_USER"];
    var mongoPass = builder.Configuration["MONGO_ROOT_PASSWORD"];

    if (!string.IsNullOrEmpty(mongoUser) && !string.IsNullOrEmpty(mongoPass))
    {
        var authSource = builder.Configuration["MONGO_AUTH_SOURCE"] ?? "admin";

        var urlBuilder = new MongoUrlBuilder(mongoConnectionString)
        {
            Username = mongoUser,
            Password = mongoPass,
            AuthenticationMechanism = "SCRAM-SHA-256",
            AuthenticationSource = authSource
        };

        Console.WriteLine($"[Startup] Connecting to MongoDB with auth: {mongoUser}@{mongoHost}:{mongoPort}");
        mongoConnectionString = urlBuilder.ToString();
    }
    else
    {
        Console.WriteLine($"[Startup] Connecting to MongoDB without auth: {mongoHost}:{mongoPort}");
    }

    var mongoContext = new MongoDbContext(mongoConnectionString, mongoDatabaseName);
    await mongoContext.InitializeAsync();
    services.AddSingleton(mongoContext);

    // --- CORS ---
    services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    var app = builder.Build();

    // --- OpenAPI docs ---
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }
    else
    {
        app.UseHttpsRedirection();
    }

    app.UseCors("AllowFrontend");
    app.UseAuthorization();

    app.MapControllers();
    app.MapHub<CanvasHub>("/hubs/canvas");

    app.Run();

}
catch (Exception ex)
{
    Console.WriteLine($"Fatal error during application startup: {ex}");
    throw;
}
finally
{
    Console.WriteLine("Application is shutting down.");
}
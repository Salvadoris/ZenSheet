using MongoDB.Driver;
using ZenSheet.Database.Models;

namespace ZenSheet.Database.Contexts
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(string connectionString, string databaseName)
        {
            var settings = MongoClientSettings.FromConnectionString(connectionString);

            settings.ConnectTimeout = TimeSpan.FromSeconds(5);
            settings.ServerSelectionTimeout = TimeSpan.FromSeconds(5);

            var client = new MongoClient(settings);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoCollection<Note> Notes => _database.GetCollection<Note>("notes");
        public IMongoCollection<Folder> Folders => _database.GetCollection<Folder>("folders");
        public IMongoCollection<CanvasAction> CanvasActions => _database.GetCollection<CanvasAction>("canvasActions");

        public async Task InitializeAsync(CancellationToken cancellationToken = default)
        {
            var retryDelay = TimeSpan.FromSeconds(10);

            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    await InitializeCoreAsync(cancellationToken);
                    return;
                }
                catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
                {
                    Console.WriteLine(
                        $"MongoDB initialization failed: {ex.Message}. Retrying in {retryDelay.TotalSeconds} seconds...");
                    await Task.Delay(retryDelay, cancellationToken);
                }
            }

            cancellationToken.ThrowIfCancellationRequested();
        }

        private async Task InitializeCoreAsync(CancellationToken cancellationToken)
        {
            var existingCollections = await _database.ListCollectionNames(cancellationToken: cancellationToken).ToListAsync(cancellationToken);

            if (!existingCollections.Contains("notes"))
                await _database.CreateCollectionAsync("notes", cancellationToken: cancellationToken);

            if (!existingCollections.Contains("folders"))
                await _database.CreateCollectionAsync("folders", cancellationToken: cancellationToken);

            if (!existingCollections.Contains("canvasActions"))
                await _database.CreateCollectionAsync("canvasActions", cancellationToken: cancellationToken);

            var noteIndexModel = new CreateIndexModel<Note>(
                Builders<Note>.IndexKeys.Ascending(n => n.ParentFolderId)
            );
            await Notes.Indexes.CreateOneAsync(noteIndexModel, cancellationToken: cancellationToken);

            var updateIndexModel = new CreateIndexModel<Note>(
                Builders<Note>.IndexKeys.Descending(n => n.UpdatedAt)
            );
            await Notes.Indexes.CreateOneAsync(updateIndexModel, cancellationToken: cancellationToken);

            var folderIndexModel = new CreateIndexModel<Folder>(
                Builders<Folder>.IndexKeys.Ascending(f => f.ParentFolderId)
            );
            await Folders.Indexes.CreateOneAsync(folderIndexModel, cancellationToken: cancellationToken);

            var actionNoteIndexModel = new CreateIndexModel<CanvasAction>(
                Builders<CanvasAction>.IndexKeys.Ascending(a => a.NoteId)
            );
            await CanvasActions.Indexes.CreateOneAsync(actionNoteIndexModel, cancellationToken: cancellationToken);

            var actionVersionIndexModel = new CreateIndexModel<CanvasAction>(
                Builders<CanvasAction>.IndexKeys.Ascending(a => a.NoteId).Ascending(a => a.Version)
            );
            await CanvasActions.Indexes.CreateOneAsync(actionVersionIndexModel, cancellationToken: cancellationToken);
        }
    }
}

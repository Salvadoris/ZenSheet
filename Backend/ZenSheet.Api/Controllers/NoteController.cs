using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ZenSheet.Api.Extensions;
using ZenSheet.Api.Hubs;
using ZenSheet.Core.Interfaces;
using ZenSheet.Core.Models.Requests;
using ZenSheet.Core.Models.Responses;
using ZenSheet.Database.Models;
namespace ZenSheet.Api.Controllers
{
    public class NoteController(
        INoteService noteService,
        IActionService actionService,
        ILogger<NoteController> logger,
        IHubContext<CanvasHub> hubContext) : HomeController
    {
        private readonly INoteService _noteService = noteService;
        private readonly IActionService _actionService = actionService;
        private readonly ILogger<NoteController> _logger = logger;
        private readonly IHubContext<CanvasHub> _hubContext = hubContext;

        [HttpPost]
        public async Task<ActionResult<NoteResponse>> CreateNote([FromBody] CreateNoteRequest request)
        {
            // TODO: Return only the newly created note Id instead of the whole note to reduce payload, client can call GetNote to get the full note details if needed
            _logger.LogMethodCall(new { request });
            try
            {
                var noteId = await _noteService.CreateNoteAsync(request);
                await _hubContext.Clients.All.SendAsync("HierarchyChanged", request.ParentFolderId);
                return Ok(new { id = noteId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create note");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NoteResponse>> GetNote(string id, [FromQuery] string? clientId = null)
        {
            _logger.LogMethodCall(new { id, clientId });
            try
            {
                var note = await _noteService.GetNoteAsync(id, clientId);
                return Ok(note);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get note {id}");
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/title")]
        public async Task<ActionResult<NoteResponse>> UpdateNoteTitle(string id, [FromBody] UpdateNoteTitleRequest request)
        {
            _logger.LogMethodCall(new { id, request });
            try
            {
                var note = await _noteService.UpdateNoteTitleAsync(id, request);
                await _hubContext.Clients.All.SendAsync("HierarchyChanged", note.ParentFolderId);
                return Ok(note);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update note title {id}");
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/content")]
        public async Task<ActionResult<NoteResponse>> UpdateNoteContent(string id, [FromBody] UpdateNoteContentRequest request)
        {
            _logger.LogMethodCall(new { id, request });
            try
            {
                var note = await _noteService.UpdateNoteContentAsync(id, request);

                if (request.Version.HasValue)
                {
                    _ = _actionService.CleanupActionsAsync(id, request.Version.Value);
                }

                return Ok(note);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update note content {id}");
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(string id)
        {
            _logger.LogMethodCall(new { id });
            try
            {
                var noteToDelete = await _noteService.GetNoteAsync(id);
                await _noteService.DeleteNoteAsync(id);
                await _hubContext.Clients.All.SendAsync("HierarchyChanged", noteToDelete.ParentFolderId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to delete note {id}");
                return BadRequest(ex.Message);
            }
        }

        // Test
        [HttpGet("{id}/actions")]
        public async Task<ActionResult<List<CanvasAction>>> GetNoteActions(string id, [FromQuery] long fromVersion = 0)
        {
            _logger.LogMethodCall(new { id, fromVersion });
            try
            {
                var actions = await _actionService.GetActionsAsync(id, fromVersion);
                return Ok(actions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get actions for note {id}");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}/version")]
        public async Task<ActionResult<NoteVersionResponse>> GetNoteVersion(string id)
        {
            _logger.LogMethodCall(new { id });
            try
            {
                var version = await _actionService.GetCurrentVersionAsync(id);
                return Ok(new NoteVersionResponse { NoteId = id, Version = version });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get version for note {id}");
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("local")]
        public async Task<ActionResult<NoteResponse>> InsertNoteFromLocal([FromBody] InsertNoteRequest request)
        {
            _logger.LogMethodCall(new { request });
            try
            {
                var note = await _noteService.InsertNoteFromLocal(request);
                await _hubContext.Clients.All.SendAsync("HierarchyChanged", request.DestinationFolderId);
                return Ok(note);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to insert a note from local");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpPost("{noteId}/copy")]
        public async Task<ActionResult<NoteResponse>> InsertNoteFromDB(string noteId, [FromQuery] string destinationFolderId)
        {
            _logger.LogMethodCall(new { noteId, destinationFolderId });
            try
            {
                var note = await _noteService.InsertNoteFromDB(noteId, destinationFolderId);
                await _hubContext.Clients.All.SendAsync("HierarchyChanged", destinationFolderId);
                return Ok(note);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to copy a note");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }
    }
}

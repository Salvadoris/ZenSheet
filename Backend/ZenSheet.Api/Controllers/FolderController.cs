using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ZenSheet.Api.Extensions;
using ZenSheet.Api.Hubs;
using ZenSheet.Core.Interfaces;
using ZenSheet.Core.Models;
using ZenSheet.Core.Models.Requests;
using ZenSheet.Core.Models.Responses;

namespace ZenSheet.Api.Controllers
{
    public class FolderController(
        IFolderService folderService,
        ILogger<FolderController> logger,
        IHubContext<CanvasHub> hubContext) : HomeController
    {
        private readonly ILogger<FolderController> _logger = logger;
        private readonly IFolderService _folderService = folderService;
        private readonly IHubContext<CanvasHub> _hubContext = hubContext;

        [HttpPost("folder")]
        public async Task<IActionResult> CreateFolder([FromBody] CreateFolderRequest request)
        {
            _logger.LogMethodCall(new { request });
            try
            {
                await _folderService.CreateFolderAsync(request);
                await _hubContext.Clients.All.SendAsync("HierarchyChanged", request.ParentFolderId ?? "");
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create folder");
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("folder/{id}")]
        public async Task<ActionResult> UpdateFolder(string folderId, [FromBody] UpdateFolderRequest request)
        {
            _logger.LogMethodCall(new { folderId, request });
            try
            {
                await _folderService.UpdateFolderAsync(folderId, request);
                await _hubContext.Clients.All.SendAsync("HierarchyChanged", folderId);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update folder {folderId}");
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("folder/{id}")]
        public async Task<IActionResult> DeleteFolder(string id)
        {
            _logger.LogMethodCall(new { id });
            try
            {
                await _folderService.DeleteFolderAsync(id);
                await _hubContext.Clients.All.SendAsync("HierarchyChanged", id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to delete folder {id}");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("resolve-path")]
        public async Task<ActionResult<ResolvePathResponse>> ResolvePath([FromQuery] string[] path)
        {
            _logger.LogMethodCall(new { path });
            try
            {
                var response = await _folderService.ResolvePathAsync(path);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to resolve path");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("hierarchy")]
        public async Task<ActionResult<List<HierarchyResponse>>> GetHierarchy()
        {
            _logger.LogMethodCall();
            try
            {
                var hierarchy = await _folderService.GetHierarchyAsync();
                return Ok(hierarchy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get hierarchy");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("folder/{folderId}")]
        public async Task<ActionResult<List<NoteHierarchyResponse>>> GetNotesByFolder(string folderId)
        {
            _logger.LogMethodCall(new { folderId });
            try
            {
                var notes = await _folderService.GetNotesByFolderAsync(folderId);
                return Ok(notes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get notes for folder {folderId}");
                return BadRequest(ex.Message);
            }
        }

        // Maybe will be removed later, since GetFoldersByParent is more general
        [HttpGet("folders")]
        public async Task<ActionResult<List<FolderResponse>>> GetFoldersInRoot()
        {
            _logger.LogMethodCall();
            try
            {
                var folders = await _folderService.GetFoldersByParentAsync("");
                return Ok(folders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get root folders");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("folders/{parentId}")]
        public async Task<ActionResult<List<FolderResponse>>> GetFoldersByParent(string parentId)
        {
            _logger.LogMethodCall(new { parentId });

            try
            {
                var folders = await _folderService.GetFoldersByParentAsync(parentId);
                return Ok(folders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get folders for parent {parentId}");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("explore")]
        public async Task<ActionResult<ExploreFolderResponse>> ExploreRoot()
        {
            _logger.LogMethodCall();
            try
            {
                var response = await ExploreFolderInternal("");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to explore root");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("explore/{folderId}")]
        public async Task<ActionResult<ExploreFolderResponse>> ExploreFolder(string folderId)
        {
            _logger.LogMethodCall(new { folderId });
            try
            {
                var response = await ExploreFolderInternal(folderId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to explore folder {folderId}");
                return BadRequest(ex.Message);
            }
        }

        private async Task<ExploreFolderResponse> ExploreFolderInternal(string folderId)
        {
            var folders = await _folderService.GetFoldersByParentAsync(folderId);
            var notes = await _folderService.GetNotesByFolderAsync(folderId);
            return new ExploreFolderResponse
            {
                FolderId = folderId,
                Folders = folders,
                Notes = notes
            };
        }

    }
}

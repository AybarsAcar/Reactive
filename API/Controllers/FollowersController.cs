using System.Collections.Generic;
using System.Threading.Tasks;
using Application.Followers;
using Application.Profiles;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
  [Route("api/profiles")]
  public class FollowersController : BaseController
  {
    // username is the username we want to follow as a logged in user
    [HttpPost("{username}/follow")]
    public async Task<ActionResult<Unit>> Follow(string username)
    {
      return await Mediator.Send(new Add.Command { Username = username });
    }

    // username is the username we want to unfollow as a logged in user
    [HttpDelete("{username}/follow")]
    public async Task<ActionResult<Unit>> Unfollow(string username)
    {
      return await Mediator.Send(new Delete.Command { Username = username });
    }

    [HttpGet("{username}/follow")]
    public async Task<ActionResult<List<Profile>>> GetFollowings(string username, string predicate)
    {
      return await Mediator.Send(new List.Query { Username = username, Predicate = predicate });
    }
  }
}
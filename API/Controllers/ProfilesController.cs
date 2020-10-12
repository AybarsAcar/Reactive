using System.Threading.Tasks;
using Application.Profiles;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
  public class ProfilesController : BaseController
  {
    [HttpGet("{username}")]
    public async Task<ActionResult<Profile>> Get(string username)
    {
      return await Mediator.Send(new Details.Query { Username = username });
    }

    [HttpPut]
    public async Task<ActionResult<Unit>> Edit(Edit.Command cmd)
    {
      return await Mediator.Send(cmd);
    }
  }
}
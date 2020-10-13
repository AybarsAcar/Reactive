using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{


  public class ActivitiesController : BaseController
  {
    [HttpGet]
    public async Task<ActionResult<List.ActivitiesEnvelope>> List(
      int? limit, int? offset, bool isGoing, bool isHost, DateTime? startDate
    )
    {
      return await Mediator.Send(new List.Query(limit, offset, isGoing, isHost, startDate));
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ActivityDto>> Details(Guid id)
    {
      return await Mediator.Send(new Details.Query { Id = id });
    }

    /* 
    Make sure to mass in the Create.Command not Activity object
    Api Controller attribute grabs the command from the body
    if not we needed to annotate wiht [FromBody]
     */
    [HttpPost]
    public async Task<ActionResult<Unit>> Create(Create.Command command)
    {
      return await Mediator.Send(command);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "IsActivityHost")]
    public async Task<ActionResult<Unit>> Edit(Guid id, Edit.Command command)
    {
      // make sure to add the id to command.Id so it will be passed
      command.Id = id;
      return await Mediator.Send(command);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "IsActivityHost")]
    public async Task<ActionResult<Unit>> Delete(Guid id)
    {
      return await Mediator.Send(new Delete.Command { Id = id });
    }

    [HttpPost("{id}/attend")]
    public async Task<ActionResult<Unit>> Attend(Guid id)
    {
      return await Mediator.Send(new Attend.Command { Id = id });
    }

    [HttpDelete("{id}/attend")]
    public async Task<ActionResult<Unit>> UnAttend(Guid id)
    {
      return await Mediator.Send(new Unattend.Command { Id = id });
    }
  }
}
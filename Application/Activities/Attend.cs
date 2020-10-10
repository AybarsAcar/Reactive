using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Activities
{
  public class Attend
  {
    public class Command : IRequest
    {
      public Guid Id { get; set; }
    }

    public class Handler : IRequestHandler<Command>
    {
      private readonly DataContext _context;
      private readonly IUserAccessor _userAccessor;
      public Handler(DataContext context, IUserAccessor userAccessor)
      {
        this._userAccessor = userAccessor;
        this._context = context;
      }

      public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
      {
        // grab the activity by its id
        var activity = await _context.Activities.FindAsync(request.Id);

        if (activity == null)
        {
          throw new RestException(HttpStatusCode.NotFound,
            new { Activity = "Could not find the activity" });
        }

        // grab the user -- we get it from the token
        var user = await _context.Users.SingleOrDefaultAsync(x =>
            x.UserName == _userAccessor.GetCurrentUsername());

        // get the attendance
        var attendence = await _context.UserActivities.SingleOrDefaultAsync(x =>
            x.ActivityId == activity.Id && x.AppUserId == user.Id);

        if (attendence != null)
        {
          // user is already attending activity
          throw new RestException(HttpStatusCode.BadRequest,
              new { Attendence = "Already attending the activity" });
        }

        attendence = new UserActivity
        {
          Activity = activity,
          AppUser = user,
          IsHost = false,
          DateJoined = DateTime.Now
        };

        _context.UserActivities.Add(attendence);

        var success = await _context.SaveChangesAsync() > 0;

        if (success) return Unit.Value;

        throw new Exception("Problem saving changes");
      }
    }
  }
}
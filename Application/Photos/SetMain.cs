using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
  public class SetMain
  {
    public class Command : IRequest
    {
      // photo Id we want to set
      public string Id { get; set; }
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
        // get a ref to the current user
        var user = await _context.Users.SingleOrDefaultAsync(
            x => x.UserName == _userAccessor.GetCurrentUsername()
        );

        var photo = user.Photos.FirstOrDefault(x => x.Id == request.Id);

        if (photo == null)
        {
          throw new RestException(HttpStatusCode.NotFound, new { Photos = "not found" });
        }

        var currentMain = user.Photos.FirstOrDefault(x => x.IsMain);

        currentMain.IsMain = false;
        photo.IsMain = true;

        var success = await _context.SaveChangesAsync() > 0;

        if (success) return Unit.Value;

        throw new Exception("Problem saving changes");
      }
    }
  }
}
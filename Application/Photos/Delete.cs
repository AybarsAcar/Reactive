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
  public class Delete
  {
    public class Command : IRequest
    {
      public string Id { get; set; }
    }

    public class Handler : IRequestHandler<Command>
    {
      private readonly DataContext _context;
      private readonly IUserAccessor _userAccessor;
      private readonly IPhotoAccessor _photoAccessor;
      public Handler(DataContext context, IUserAccessor userAccessor, IPhotoAccessor photoAccessor)
      {
        this._photoAccessor = photoAccessor;
        this._userAccessor = userAccessor;
        this._context = context;
      }

      public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
      {
        // get a ref to the user
        var user = await _context.Users.SingleOrDefaultAsync(
            x => x.UserName == _userAccessor.GetCurrentUsername()
        );

        var photo = user.Photos.FirstOrDefault(x => x.Id == request.Id);

        if (photo == null)
        {
          throw new RestException(HttpStatusCode.NotFound, new { Photo = "not found" });
        }

        if (photo.IsMain)
        {
          throw new RestException(
              HttpStatusCode.BadRequest, new { Photo = "You cannot delete your main photo" });
        }

        // delete it
        var result = _photoAccessor.DeletePhoto(photo.Id);

        if (result == null)
        {
          throw new Exception("Problem deleting the photo");
        }

        // and remove it from that users collection
        user.Photos.Remove(photo);

        var success = await _context.SaveChangesAsync() > 0;

        if (success) return Unit.Value;

        throw new Exception("Problem saving changes");
      }
    }
  }
}
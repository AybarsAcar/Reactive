using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
  /* 
  add a photo handler
   */
  public class Add
  {
    public class Command : IRequest<Photo>
    {
      public IFormFile File { get; set; }
    }

    public class Handler : IRequestHandler<Command, Photo>
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

      public async Task<Photo> Handle(Command request, CancellationToken cancellationToken)
      {
        var photoUploadResult = _photoAccessor.AddPhoto(request.File);

        var user = await _context.Users.SingleOrDefaultAsync(
            x => x.UserName == _userAccessor.GetCurrentUsername()
        );

        var photo = new Photo
        {
          Url = photoUploadResult.Url,
          Id = photoUploadResult.PublicId
        };

        // check if the photo set to main photo if not set this one as main
        if (!user.Photos.Any(x => x.IsMain))
        {
          photo.IsMain = true;
        }

        // add the ptoyo to that users photos collection
        user.Photos.Add(photo);

        var success = await _context.SaveChangesAsync() > 0;

        if (success) return photo;

        throw new Exception("Problem saving changes");
      }
    }
  }
}
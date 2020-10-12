using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Profiles
{
  public class ProfileReader : IProfileReader
  {
    private readonly DataContext _context;
    private readonly IUserAccessor _userAccessor;
    public ProfileReader(DataContext context, IUserAccessor userAccessor)
    {
      this._userAccessor = userAccessor;
      this._context = context;
    }

    public async Task<Profile> ReadProfile(string username)
    {
      // get the user passed in
      var user = await _context.Users.SingleOrDefaultAsync(
          x => x.UserName == username
      );

      if (user == null)
      {
        throw new RestException(HttpStatusCode.NotFound, new { User = "Not found" });
      }

      // get the current user
      var currentUser = await _context.Users.SingleOrDefaultAsync(
          x => x.UserName == _userAccessor.GetCurrentUsername()
      );

      // create the profile we are returning
      var profile = new Profile
      {
        DisplayName = user.DisplayName,
        Username = user.UserName,
        Image = user.Photos.FirstOrDefault(x => x.IsMain)?.Url,
        Photos = user.Photos,
        Bio = user.Bio,
        FollowersCount = user.Followers.Count(),
        FollowingCount = user.Followings.Count(),
      };

      // set the IsFollowed property in the profile before returning the profile
      if (currentUser.Followings.Any(x => x.TargetId == user.Id))
      {
        profile.IsFollowed = true;
      }

      return profile;
    }
  }
}
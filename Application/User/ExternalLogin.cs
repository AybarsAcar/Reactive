using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Application.User
{
  public class ExternalLogin
  {
    public class Query : IRequest<User>
    {
      public string AccessToken { get; set; }
    }

    public class Handler : IRequestHandler<Query, User>
    {
      private readonly UserManager<AppUser> _userManager;
      private readonly IFacebookAccessor _facebookAccessor;
      private readonly IJwtGenerator _jwtGenerator;
      public Handler(UserManager<AppUser> userManager, IFacebookAccessor facebookAccessor, IJwtGenerator jwtGenerator)
      {
        this._jwtGenerator = jwtGenerator;
        this._facebookAccessor = facebookAccessor;
        this._userManager = userManager;
      }

      public async Task<User> Handle(Query request, CancellationToken cancellationToken)
      {
        // handler logic
        var userInfo = await _facebookAccessor.FacebookLogin(request.AccessToken);

        // if token is unverified or unsuccessful response from facebook
        if (userInfo == null)
        {
          throw new RestException(HttpStatusCode.BadRequest, new { User = "Problem validating token" });
        }

        // find the user by their email
        var user = await _userManager.FindByEmailAsync(userInfo.Email);

        var refreshToken = _jwtGenerator.GenerateRefreshToken();

        if (user != null)
        {
          // they have loggen in before
          user.RefreshTokens.Add(refreshToken);
          await _userManager.UpdateAsync(user);

          return new User(user, _jwtGenerator, refreshToken.Token);
        }

        // if no user create them
        user = new AppUser
        {
          DisplayName = userInfo.Name,
          Id = userInfo.Id,
          Email = userInfo.Email,
          UserName = "fb_" + userInfo.Id
        };

        var photo = new Photo
        {
          Id = "fb_" + userInfo.Id,
          // this is their main img in facebook
          Url = userInfo.Picture.Data.Url,
          IsMain = true
        };

        user.Photos.Add(photo);

        user.RefreshTokens.Add(refreshToken);

        var result = await _userManager.CreateAsync(user);

        if (!result.Succeeded)
        {
          throw new RestException(HttpStatusCode.BadRequest, new { User = "Problem creating the user" });
        }

        return new User(user, _jwtGenerator, refreshToken.Token);
      }
    }
  }
}
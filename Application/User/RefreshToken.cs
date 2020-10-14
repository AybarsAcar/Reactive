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
using Persistence;

namespace Application.User
{
  public class RefreshToken
  {
    public class Command : IRequest<User>
    {
      public string RefreshToken { get; set; }
    }

    public class Handler : IRequestHandler<Command, User>
    {
      private readonly UserManager<AppUser> _userManager;
      private readonly IJwtGenerator _jwtGenerator;
      private readonly IUserAccessor _userAccessor;
      public Handler(UserManager<AppUser> userManager, IJwtGenerator jwtGenerator, IUserAccessor userAccessor)
      {
        this._userAccessor = userAccessor;
        this._jwtGenerator = jwtGenerator;
        this._userManager = userManager;

      }

      public async Task<User> Handle(Command request, CancellationToken cancellationToken)
      {
        // get the user
        var user = await _userManager.FindByNameAsync(_userAccessor.GetCurrentUsername());

        var oldToken = user.RefreshTokens.SingleOrDefault(
            x => x.Token == request.RefreshToken
        );

        // if no old refresh token return error
        if (oldToken != null && !oldToken.IsActive)
        {
          throw new RestException(HttpStatusCode.Unauthorized);
        }

        // revoke old token if already exists
        if (oldToken != null)
        {
          oldToken.Revoked = DateTime.UtcNow;
        }

        var newRefreshToken = _jwtGenerator.GenerateRefreshToken();
        user.RefreshTokens.Add(newRefreshToken);

        await _userManager.UpdateAsync(user);

        return new User(user, _jwtGenerator, newRefreshToken.Token);
      }
    }
  }
}
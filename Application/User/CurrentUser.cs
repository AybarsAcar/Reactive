using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Persistence;

namespace Application.User
{
  public class CurrentUser
  {
    public class Query : IRequest<User> { }

    public class Handler : IRequestHandler<Query, User>
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

      public async Task<User> Handle(Query request, CancellationToken cancellationToken)
      {
        //   get our user from the db
        var user = await _userManager.FindByNameAsync(_userAccessor.GetCurrentUsername());

        // create the refresh token
        var refreshToken = _jwtGenerator.GenerateRefreshToken();
        user.RefreshTokens.Add(refreshToken);

        // update the user using userManager
        await _userManager.UpdateAsync(user);

        return new User(user, _jwtGenerator, refreshToken.Token);
      }
    }
  }
}
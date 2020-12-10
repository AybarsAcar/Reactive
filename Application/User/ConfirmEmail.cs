using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Domain;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;

namespace Application.User
{
  public class ConfirmEmail
  {
    public class Command : IRequest<IdentityResult>
    {
      public string Token { get; set; }
      public string Email { get; set; }
    }

    public class CommandValidator : AbstractValidator<Command>
    {
      public CommandValidator()
      {
        RuleFor(x => x.Email).NotEmpty();
        RuleFor(x => x.Token).NotEmpty();
      }
    }

    public class Handler : IRequestHandler<Command, IdentityResult>
    {
      private readonly UserManager<AppUser> _userManager;
      public Handler(UserManager<AppUser> userManager)
      {
        this._userManager = userManager;
      }

      public async Task<IdentityResult> Handle(Command request, CancellationToken cancellationToken)
      {
        var user = await _userManager.FindByEmailAsync(request.Email);

        // decode the token on the back in
        var decodedTokenBytes = WebEncoders.Base64UrlDecode(request.Token);
        var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);

        // validates the EmailConfirmed field in the user
        return await _userManager.ConfirmEmailAsync(user, decodedToken);
      }
    }
  }
}
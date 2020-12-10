using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;

namespace Application.User
{
  public class ResendEmailVerification
  {
    public class Query : IRequest
    {
      public string Email { get; set; }
      public string Origin { get; set; }
    }

    public class Handler : IRequestHandler<Query>
    {
      private readonly UserManager<AppUser> _userManager;
      private readonly IEmailSender _emailSender;
      public Handler(UserManager<AppUser> userManager, IEmailSender emailSender)
      {
        this._emailSender = emailSender;
        this._userManager = userManager;
      }

      public async Task<Unit> Handle(Query request, CancellationToken cancellationToken)
      {
        // get the user from their email
        var user = await _userManager.FindByEmailAsync(request.Email);

        // get a token to send to the user
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

        // we will send it in a query string
        token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        // build up the email - will take the user to the react application
        var verifyUrl = $"{request.Origin}/user/verifyEmail?token={token}&email={request.Email}";

        var message = "<h1>Verify your Email</h1>" +
          "<p>Please click the below link to verify your email address:</p>" +
          $"<p><a href='{verifyUrl}'>{verifyUrl}</a></p>";

        await _emailSender.SendEmailAsync(request.Email, "Please verify your email address", message);

        return Unit.Value;
      }
    }
  }
}
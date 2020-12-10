using System;
using System.Threading.Tasks;
using Application.User;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
  public class UserController : BaseController
  {
    //   ur query includes the user email and password
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<User>> Login(Login.Query query)
    {
      var user = await Mediator.Send(query);
      SetTokenCookie(user.RefreshToken);

      return user;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult> Register(Register.Command command)
    {
      // get the origin
      command.Origin = Request.Headers["origin"];
      await Mediator.Send(command);

      return Ok("Registration successful - please check your email");
    }

    // getting the current user
    [HttpGet]
    public async Task<ActionResult<User>> CurrentUser()
    {
      var user = await Mediator.Send(new CurrentUser.Query());
      SetTokenCookie(user.RefreshToken);

      return user;
    }

    // facebook
    [AllowAnonymous]
    [HttpPost("facebook")]
    public async Task<ActionResult<User>> FacebookLogin(ExternalLogin.Query query)
    {
      var user = await Mediator.Send(query);
      SetTokenCookie(user.RefreshToken);

      return user;
    }

    [HttpPost("refreshToken")]
    public async Task<ActionResult<User>> RefreshToken(Application.User.RefreshToken.Command cmd)
    {
      // get the refresh token from cookies
      cmd.RefreshToken = Request.Cookies["refreshToken"];

      var user = await Mediator.Send(cmd);

      SetTokenCookie(user.RefreshToken);

      return user;
    }

    [AllowAnonymous]
    [HttpPost("verifyEmail")]
    public async Task<ActionResult> VerifyEmail(ConfirmEmail.Command cmd)
    {
      var result = await Mediator.Send(cmd);

      if (!result.Succeeded) return BadRequest("Problem verifying email address");

      return Ok("Email confirmed - you can now login");
    }

    [AllowAnonymous]
    [HttpGet("resendEmailVerification")]
    public async Task<ActionResult> ResendEmailVerification([FromQuery] ResendEmailVerification.Query query)
    {
      query.Origin = Request.Headers["origin"];
      await Mediator.Send(query);

      return Ok("Email verification link sent - please check email");
    }

    private void SetTokenCookie(string refreshToken)
    {
      var cookieOptions = new CookieOptions
      {
        HttpOnly = true,
        Expires = DateTime.UtcNow.AddDays(7)
      };

      Response.Cookies.Append("refreshToken", refreshToken);
    }
  }
}
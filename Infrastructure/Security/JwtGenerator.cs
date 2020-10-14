using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Application.Interfaces;
using Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Security
{
  public class JwtGenerator : IJwtGenerator
  {
    private readonly SymmetricSecurityKey _key;
    public JwtGenerator(IConfiguration config)
    {
      _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["TokenKey"]));
    }

    public string CreateToken(AppUser user)
    {
      var claims = new List<Claim>
        {
            // this adds user name as a nameid to the token
            new Claim(JwtRegisteredClaimNames.NameId, user.UserName)
        };

      // generate signin credentials
      var credentials = new SigningCredentials(_key, SecurityAlgorithms.HmacSha512Signature);

      // create the token
      var tokenDescriptor = new SecurityTokenDescriptor
      {
        Subject = new ClaimsIdentity(claims),
        Expires = DateTime.Now.AddMinutes(15),
        SigningCredentials = credentials
      };

      var tokenHandler = new JwtSecurityTokenHandler();

      var token = tokenHandler.CreateToken(tokenDescriptor);

      return tokenHandler.WriteToken(token);
    }

    public RefreshToken GenerateRefreshToken()
    {
      var randomNumber = new byte[32];
      using var rng = RandomNumberGenerator.Create();
      rng.GetBytes(randomNumber);
      return new RefreshToken
      {
        Token = Convert.ToBase64String(randomNumber)
      };
    }
  }
}
using System.Linq;
using System.Text.Json.Serialization;
using Application.Interfaces;
using Domain;

namespace Application.User
{
  /* 
  fields we want to return to the client
   */
  public class User
  {
    public User(AppUser user, IJwtGenerator jwtGenerator, string refreshToken)
    {
      this.DisplayName = user.DisplayName;
      this.Token = jwtGenerator.CreateToken(user);
      this.UserName = user.UserName;
      this.Image = user.Photos.FirstOrDefault(x => x.IsMain)?.Url;
      this.RefreshToken = refreshToken;

    }
    public string DisplayName { get; set; }
    public string Token { get; set; }
    public string UserName { get; set; }
    public string Image { get; set; }

    [JsonIgnore]
    public string RefreshToken { get; set; }
  }
}
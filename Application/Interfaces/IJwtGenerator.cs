using Domain;

namespace Application.Interfaces
{
  public interface IJwtGenerator
  {
    //   we get a string back which is the JWT
    string CreateToken(AppUser user);
  }
}
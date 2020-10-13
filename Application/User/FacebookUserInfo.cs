namespace Application.User
{
  /* 
  these are the props we get from the accessToken from facebook
   */
  public class FacebookUserInfo
  {
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }

    public FacebookPictureDate Picture { get; set; }
  }

  public class FacebookPictureDate
  {
    public FacebookPicture Data { get; set; }
  }

  public class FacebookPicture
  {
    public string Url { get; set; }
  }
}
namespace Infrastructure.Photos
{
  public class CloudinarySettings
  {
    //   fields have to match the user-secrets
    public string CloudName { get; set; }
    public string ApiKey { get; set; }
    public string ApiSecret { get; set; }
  }
}
namespace Domain
{
  public class Photo
  {
    public string Id { get; set; }
    public string Url { get; set; }
    // if the main photo for the user
    public bool IsMain { get; set; }
  }
}
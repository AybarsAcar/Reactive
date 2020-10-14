using System;

namespace Domain
{
  /* 
  refresh tokens stored with the USer
   */
  public class RefreshToken
  {
    public int Id { get; set; }
    public virtual AppUser Appuser { get; set; }
    public string Token { get; set; }

    public DateTime Expires { get; set; } = DateTime.UtcNow.AddDays(14);

    public bool IsExpired => DateTime.UtcNow >= Expires;

    public DateTime? Revoked { get; set; }

    public bool IsActive => Revoked == null & !IsExpired;
  }
}
using System;
using System.Collections.Generic;

namespace Domain
{
  /* 
  this will represent the join table
   */
  public class UserActivity
  {
    public string AppUserId { get; set; }
    public virtual AppUser AppUser { get; set; }

    public Guid ActivityId { get; set; }
    public virtual Activity Activity { get; set; }

    public DateTime DateJoined { get; set; }
    public bool IsHost { get; set; }
  }
}
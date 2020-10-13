using System.IO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
  /* 
  this controller is the fallback when we serve our application
  for our static files
  this is to serve our viewlayer
   */
  [AllowAnonymous]
  public class FallbackController : Controller
  {
    public IActionResult Index()
    {
      return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(),
        "wwwroot", "index.html"), "text/HTML");
    }
  }
}
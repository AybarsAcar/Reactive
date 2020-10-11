using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using API.Middleware;
using Application.Activities;
using Application.Interfaces;
using AutoMapper;
using Domain;
using FluentValidation.AspNetCore;
using Infrastructure.Photos;
using Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Persistence;

namespace API
{
  public class Startup
  {
    public Startup(IConfiguration configuration)
    {
      Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    public void ConfigureServices(IServiceCollection services)
    {
      services.AddDbContext<DataContext>(opt =>
      {
        opt.UseLazyLoadingProxies();
        opt.UseSqlite(Configuration.GetConnectionString("DefaultConnection"));
      });

      services.AddCors(opt =>
      {
        opt.AddPolicy("CorsPolicy", policy =>
        {
          policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:3000");
        });
      });

      services.AddMediatR(typeof(List.Handler).Assembly);

      services.AddAutoMapper(typeof(List.Handler));

      services.AddControllers(opt =>
      {
        // authentication policy -- all routes
        var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
        opt.Filters.Add(new AuthorizeFilter(policy));
      })
        .AddFluentValidation(cfg =>
        {
          cfg.RegisterValidatorsFromAssemblyContaining<Create>();
        });

      // Adding the netcore Identiy
      var builder = services.AddIdentityCore<AppUser>();
      var identityBuilder = new IdentityBuilder(builder.UserType, builder.Services);
      identityBuilder.AddEntityFrameworkStores<DataContext>();
      identityBuilder.AddSignInManager<SignInManager<AppUser>>();

      // custom auth middleware for IsHost
      services.AddAuthorization(opt =>
      {
        opt.AddPolicy("IsActivityHost", policy =>
        {
          policy.Requirements.Add(new IsHostRequirement());
        });
      });
      services.AddTransient<IAuthorizationHandler, IsHostRequirementHandler>();


      var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["TokenKey"]));
      services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opt =>
        {
          opt.TokenValidationParameters = new TokenValidationParameters
          {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateAudience = false,
            ValidateIssuer = false
          };
        });

      // JWT generator and accessor(to get the info from it)
      services.AddScoped<IJwtGenerator, JwtGenerator>();
      services.AddScoped<IUserAccessor, UserAccessor>();

      services.AddScoped<IPhotoAccessor, PhotoAccessor>();

      // cloudinary -- so we have access to our api keys secrets, and cloud name
      services.Configure<CloudinarySettings>(Configuration.GetSection("Cloudinary"));
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {

      // our custom Error Handling Middleware
      app.UseMiddleware<ErrorHandlingMiddleware>();

      if (env.IsDevelopment())
      {
        // app.UseDeveloperExceptionPage();
      }

      //   app.UseHttpsRedirection();

      app.UseRouting();

      app.UseCors("CorsPolicy");

      app.UseAuthentication();

      app.UseAuthorization();

      app.UseEndpoints(endpoints =>
      {
        endpoints.MapControllers();
      });
    }
  }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using API.Middleware;
using API.SignalR;
using Application.Activities;
using Application.Interfaces;
using Application.Profiles;
using AutoMapper;
using Domain;
using FluentValidation.AspNetCore;
using Infrastructure.Email;
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

    public void ConfigureDevelopmentServices(IServiceCollection services)
    {
      services.AddDbContext<DataContext>(opt =>
      {
        opt.UseLazyLoadingProxies();
        opt.UseSqlite(Configuration.GetConnectionString("DefaultConnection"));
      });

      ConfigureServices(services);
    }

    public void ConfigureProductionServices(IServiceCollection services)
    {
      services.AddDbContext<DataContext>(opt =>
      {
        opt.UseLazyLoadingProxies();
        opt.UseMySql(Configuration.GetConnectionString("DefaultConnection"));
      });

      ConfigureServices(services);
    }

    public void ConfigureServices(IServiceCollection services)
    {
      services.AddCors(opt =>
      {
        opt.AddPolicy("CorsPolicy", policy =>
        {
          policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("WWW-Authenticate")
            .WithOrigins("http://localhost:3000")
            .AllowCredentials();
        });
      });

      services.AddMediatR(typeof(List.Handler).Assembly);

      services.AddAutoMapper(typeof(List.Handler));

      services.AddSignalR();

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
      var builder = services.AddIdentityCore<AppUser>(options =>
      {
        options.SignIn.RequireConfirmedEmail = true;
      });
      var identityBuilder = new IdentityBuilder(builder.UserType, builder.Services);
      identityBuilder.AddEntityFrameworkStores<DataContext>();
      identityBuilder.AddSignInManager<SignInManager<AppUser>>();
      identityBuilder.AddDefaultTokenProviders();

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
            ValidateIssuer = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
          };

          // signalR authentication options
          opt.Events = new JwtBearerEvents
          {
            OnMessageReceived = context =>
            {
              var accessToken = context.Request.Query["access_token"];
              var path = context.HttpContext.Request.Path;

              if (!string.IsNullOrEmpty(accessToken) && (path.StartsWithSegments("/chat")))
              {
                context.Token = accessToken;
              }
              return Task.CompletedTask;
            }
          };
        });

      // JWT generator and accessor(to get the info from it)
      services.AddScoped<IJwtGenerator, JwtGenerator>();
      services.AddScoped<IUserAccessor, UserAccessor>();

      services.AddScoped<IPhotoAccessor, PhotoAccessor>();

      services.AddScoped<IProfileReader, ProfileReader>();

      services.AddScoped<IFacebookAccessor, FacebookAccessor>();

      services.AddScoped<IEmailSender, EmailSender>();

      // cloudinary -- so we have access to our api keys secrets, and cloud name
      services.Configure<CloudinarySettings>(Configuration.GetSection("Cloudinary"));

      services.Configure<FacebookAppSettings>(Configuration.GetSection("Authentication:Facebook"));

      services.Configure<SendGridSettings>(Configuration.GetSection("SendGrid"));
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

      // Serving Stating Files After Build
      app.UseDefaultFiles();
      app.UseStaticFiles();
      // ends

      app.UseRouting();

      app.UseCors("CorsPolicy");

      app.UseAuthentication();

      app.UseAuthorization();

      app.UseEndpoints(endpoints =>
      {
        endpoints.MapControllers();
        endpoints.MapHub<ChatHub>("/chat");
        // endpoints.MapFallbackToController("Index", "Fallback");
      });
    }
  }
}

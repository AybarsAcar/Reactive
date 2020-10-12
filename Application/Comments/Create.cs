using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Comments
{
  public class Create
  {
    public class Command : IRequest<CommentDto>
    {
      public string Body { get; set; }
      public Guid ActivityId { get; set; }
      public string Username { get; set; }
    }

    public class Handler : IRequestHandler<Command, CommentDto>
    {
      private readonly DataContext _context;
      private readonly IMapper _mapper;
      public Handler(DataContext context, IMapper mapper)
      {
        this._mapper = mapper;
        this._context = context;
      }

      public async Task<CommentDto> Handle(Command request, CancellationToken cancellationToken)
      {
        // get activity
        var activity = await _context.Activities.FindAsync(request.ActivityId);

        if (activity == null)
        {
          throw new RestException(HttpStatusCode.NotFound, new { Activity = "Not found" });
        }

        // grab the user
        var user = await _context.Users.SingleOrDefaultAsync(x => x.UserName == request.Username);

        // create the comment
        var comment = new Comment
        {
          Author = user,
          Activity = activity,
          Body = request.Body,
          CreatedAt = DateTime.Now
        };

        activity.Comments.Add(comment);

        var success = await _context.SaveChangesAsync() > 0;

        // return the comment
        if (success) return _mapper.Map<CommentDto>(comment);

        throw new Exception("Problem saving changes");
      }
    }
  }
}
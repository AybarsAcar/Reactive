using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Persistence;

namespace Application.Activities
{
  public class List
  {
    public class Query : IRequest<List<ActivityDto>> { }

    public class Handler : IRequestHandler<Query, List<ActivityDto>>
    {
      private readonly DataContext _context;
      private readonly IMapper _mapper;
      public Handler(DataContext context, IMapper mapper)
      {
        this._mapper = mapper;
        this._context = context;
      }

      /* 
      Responsible for grabbing all the activities from the db
      it will be used in our GET end points
       */
      public async Task<List<ActivityDto>> Handle(Query request, CancellationToken cancellationToken)
      {
        // get the appuser and the useractivities withthe activities
        var activities = await _context.Activities
          .ToListAsync();

        // return the DTO through mapper
        return _mapper.Map<List<Activity>, List<ActivityDto>>(activities);
      }
    }
  }
}
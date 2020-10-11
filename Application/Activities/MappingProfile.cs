using System.Linq;
using AutoMapper;
using Domain;

namespace Application.Activities
{
  public class MappingProfile : Profile
  {
    public MappingProfile()
    {
      // From -> To
      CreateMap<Activity, ActivityDto>();
      CreateMap<UserActivity, AttendeeDto>()
        .ForMember(dest => dest.Username, opt => opt.MapFrom(source => source.AppUser.UserName))
        .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(source => source.AppUser.DisplayName))
        .ForMember(dest => dest.Image, opt => opt.MapFrom(
          source => source.AppUser.Photos.FirstOrDefault(x => x.IsMain).Url));
    }
  }
}
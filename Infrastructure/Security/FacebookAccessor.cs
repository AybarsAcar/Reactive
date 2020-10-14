using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Application.Interfaces;
using Application.User;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace Infrastructure.Security
{
  /* 
  goes and grabs info directy from facebook and verifies the token
   */
  public class FacebookAccessor : IFacebookAccessor
  {
    private readonly HttpClient _httpClient;
    private readonly IOptions<FacebookAppSettings> _config;

    public FacebookAccessor(IOptions<FacebookAppSettings> config)
    {
      this._config = config;
      this._httpClient = new HttpClient
      {
        BaseAddress = new System.Uri("https://graph.facebook.com/")
      };

      _httpClient.DefaultRequestHeaders
        .Accept
        .Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<FacebookUserInfo> FacebookLogin(string accessToken)
    {
      // verify the token is valid via the API to verify it from facebook
      var verifyToken = await _httpClient.GetAsync(
          $"debug_token?input_token={accessToken}&access_token={_config.Value.AppId}|{_config.Value.AppSecret}"
        );

      if (!verifyToken.IsSuccessStatusCode)
      {
        return null;
      }

      // go to facebook again and get the user info
      var result = await GetAsync<FacebookUserInfo>(
          accessToken, "me", "fields=name,email,picture.width(100).height(100)");

      return result;
    }

    /* 
    method to get facebook user info and deserialise
     */
    private async Task<T> GetAsync<T>(string accessToken, string endpoint, string args)
    {
      var response = await _httpClient.GetAsync(
            $"{endpoint}?access_token={accessToken}&{args}"
        );

      if (!response.IsSuccessStatusCode)
      {
        return default(T);
      }

      var result = await response.Content.ReadAsStringAsync();

      return JsonConvert.DeserializeObject<T>(result);
    }
  }
}
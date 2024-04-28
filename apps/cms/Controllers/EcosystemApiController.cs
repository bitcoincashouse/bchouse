using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Cache;
using BCHouse.Constants;

public struct Project
{
  public string id { get; set; }
  public string name { get; set; }
  public string description { get; set; }
  public string href { get; set; }
  public string? img { get; set; }

  public IEnumerable<string> type { get; set; }
}

namespace BCHouse.Controller
{
  public class EcosystemController : UmbracoApiController
  {

    private readonly UmbracoHelper umbracoHelper;
    private readonly IAppCache runtimeCache;

    private readonly string baseUrl;

    public EcosystemController(UmbracoHelper umbracoHelper, AppCaches appCaches)
    {
      this.umbracoHelper = umbracoHelper;
      this.baseUrl = Environment.GetEnvironmentVariable("UMBRACO_URL") ?? "";
      this.runtimeCache = appCaches.RuntimeCache;
    }

    private int? _ecosystemProjectsContainerId = null;
    private int? EcosystemProjectsContainerId
    {
      get
      {
        if (_ecosystemProjectsContainerId == null)
        {
          _ecosystemProjectsContainerId = umbracoHelper.ContentAtRoot().First(content => content.ContentType.Alias.Equals(Constants.ContentTypes.ECOSYSTEM_PROJECTS))?.Id;
        }
        return _ecosystemProjectsContainerId;
      }
    }


    public IEnumerable<Project> GetAllProjects()
    {
      var cachedProjects = runtimeCache.GetCacheItem<IEnumerable<Project>>(Constants.CacheKeys.GET_ALL_ECOSYSTEM_PROJECTS, () =>
      {
        if (EcosystemProjectsContainerId == null) return new Project[0];

        var ecosystemProjectsContainer = umbracoHelper.Content(EcosystemProjectsContainerId);

        if (ecosystemProjectsContainer == null) return new Project[0];

        var ecosystemProjects = ecosystemProjectsContainer.Children;

        return ecosystemProjects.Select(project =>
        {
          var description = project.Value<string>("description");
          var link = project.Value<Link>("link");
          var image = project.Value<MediaWithCrops>("image");
          var type = project.Value<IEnumerable<string>>("type")?.Select(type => type.ToLower());

          return new Project
          {
            id = project.Id.ToString(),
            name = project.Name,
            description = description ?? "",
            href = link?.Url ?? "",
            img = image != null ? this.baseUrl + image.MediaUrl() : "",
            type = type ?? new string[0]
          };
        }).ToArray();
      });

      return cachedProjects ?? new Project[0];
    }
  }
}
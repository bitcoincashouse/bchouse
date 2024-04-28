using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Cache;

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
    public static string ECOSYSTEM_PROJECTS_CACHE_KEY = "EcosystemProjects";

    private readonly UmbracoHelper umbracoHelper;
    private readonly IAppCache runtimeCache;

    private readonly string baseUrl;

    public EcosystemController(UmbracoHelper umbracoHelper, AppCaches appCaches)
    {
      this.umbracoHelper = umbracoHelper;
      this.baseUrl = Environment.GetEnvironmentVariable("UMBRACO_URL") ?? "";
      this.runtimeCache = appCaches.RuntimeCache;
    }

    public IEnumerable<Project> GetAllProjects()
    {
      var cachedProjects = runtimeCache.GetCacheItem<IEnumerable<Project>>(EcosystemController.ECOSYSTEM_PROJECTS_CACHE_KEY, () =>
      {
        var ecosystemProjectsContainer = umbracoHelper.Content(1059);
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
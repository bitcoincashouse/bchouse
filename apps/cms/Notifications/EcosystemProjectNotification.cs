using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Core.Cache;

namespace BCHouse.Notifications;

public class EcosystemProjectNotifications : INotificationHandler<ContentPublishingNotification>, INotificationHandler<ContentUnpublishingNotification>, INotificationHandler<ContentDeletedNotification>
{

  private readonly IAppCache runtimeCache;

  public EcosystemProjectNotifications(AppCaches appCaches)
  {
    this.runtimeCache = appCaches.RuntimeCache;
  }

  private void HandleEcosystemProjectChange(IEnumerable<Umbraco.Cms.Core.Models.IContent> content)
  {
    if (content.Any(content => content.ContentType.Alias.Equals("project")))
    {
      runtimeCache.ClearByKey(BCHouse.Controller.EcosystemController.ECOSYSTEM_PROJECTS_CACHE_KEY);
    }
  }

  public void Handle(ContentPublishingNotification notification)
  {
    HandleEcosystemProjectChange(notification.PublishedEntities);
  }

  public void Handle(ContentUnpublishingNotification notification)
  {
    HandleEcosystemProjectChange(notification.UnpublishedEntities);
  }

  public void Handle(ContentDeletedNotification notification)
  {
    HandleEcosystemProjectChange(notification.DeletedEntities);
  }
}
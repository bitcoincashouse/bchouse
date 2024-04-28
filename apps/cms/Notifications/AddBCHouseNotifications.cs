using Umbraco.Cms.Core.Notifications;

namespace BCHouse.Notifications
{
  public static class UmbracoBuilderNotificationExtensions
  {
    // https://our.umbraco.com/documentation/Reference/Notifications/#registering-many-notification-handlers
    public static IUmbracoBuilder AddBCHouseNotifications(this IUmbracoBuilder builder)
    {
      builder
        .AddNotificationHandler<ContentPublishingNotification, EcosystemProjectNotifications>()
        .AddNotificationHandler<ContentUnpublishingNotification, EcosystemProjectNotifications>()
        .AddNotificationHandler<ContentDeletedNotification, EcosystemProjectNotifications>();

      return builder;
    }
  }
}
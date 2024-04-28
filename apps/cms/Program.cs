using BCHouse.Notifications;
using Our.Umbraco.StorageProviders.AWSS3.DependencyInjection;
using dotenv.net;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

if (env == "Development")
{
  DotEnv.Load(options: new DotEnvOptions(envFilePaths: new[] {
        "../../.env.development"
    }));
}

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddDeliveryApi()
    .AddComposers()
    .AddBCHouseNotifications()
    .AddAWSS3MediaFileSystem((options) =>
    {
      var accessKey = Environment.GetEnvironmentVariable("STORAGE_ACCESS_KEY");
      var secretKey = Environment.GetEnvironmentVariable("STORAGE_SECRET_KEY");
      if (accessKey != null) options.AccessKey = accessKey;
      if (secretKey != null) options.AccessSecret = secretKey;
    })
    .Build();

WebApplication app = builder.Build();

await app.BootUmbracoAsync();


app.UseUmbraco()
    .WithMiddleware(u =>
    {
      u.AppBuilder.UseCors(policy =>
      {
        if (env == "Development")
        {
          policy
          .AllowAnyOrigin()
          .AllowAnyHeader()
          .AllowAnyMethod();
        }
        else
        {
          var bchouseUrl = Environment.GetEnvironmentVariable("BCHOUSE_URL");
          if (!bchouseUrl.IsNullOrWhiteSpace()) policy.WithOrigins(bchouseUrl);
        }
      });
      u.UseBackOffice();
      u.UseWebsite();
      u.UseAWSS3MediaFileSystem();
    })
    .WithEndpoints(u =>
    {
      u.UseInstallerEndpoints();
      u.UseBackOfficeEndpoints();
      u.UseWebsiteEndpoints();
    });

await app.RunAsync();

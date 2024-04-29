FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /Umbraco
COPY . ./
RUN dotnet restore
RUN dotnet publish -c Release -o release

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /Umbraco
COPY --from=build-env /Umbraco/release .
CMD dotnet BCHouse.dll
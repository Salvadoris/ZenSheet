FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["ZenSheet.Api/ZenSheet.Api.csproj", "ZenSheet.Api/"]
COPY ["ZenSheet.Core/ZenSheet.Core.csproj", "ZenSheet.Core/"]
COPY ["ZenSheet.Database/ZenSheet.Database.csproj", "ZenSheet.Database/"]
RUN dotnet restore "ZenSheet.Api/ZenSheet.Api.csproj"

COPY . .
WORKDIR "/src/ZenSheet.Api"
RUN dotnet build "ZenSheet.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "ZenSheet.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false
RUN dotnet dev-certs https -ep /app/publish/certificate.pfx -p password
RUN chmod 644 /app/publish/certificate.pfx

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ZenSheet.Api.dll"]

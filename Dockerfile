# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /App

# Copia tudo para dentro do container
COPY . ./

# 1. Dizemos ao Docker EXATAMENTE qual projeto ele deve restaurar
RUN dotnet restore RoleMaster.API/RoleMaster.API.csproj

# 2. Compila e publica apenas a API (o .NET é inteligente e compila o Core e a Infrastructure junto automaticamente)
RUN dotnet publish RoleMaster.API/RoleMaster.API.csproj -c Release -o out

# Estágio de Produção (Imagem mais leve apenas para rodar)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /App
COPY --from=build-env /App/out .

# Configura as portas para o Render não se perder
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Ponto de entrada do sistema
ENTRYPOINT ["dotnet", "RoleMaster.API.dll"]
# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /App

# Copia tudo para dentro do container
COPY . ./
# Restaura as dependências e compila
RUN dotnet restore
RUN dotnet publish -c Release -o out

# Estágio de Produção (Imagem mais leve apenas para rodar)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /App
COPY --from=build-env /App/out .

# Configura as portas para o Render não se perder
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# ===> MUDE O NOME AQUI SE NECESSÁRIO <===
ENTRYPOINT ["dotnet", "RoleMaster.API.dll"]
# 🎲 RoleMaster - Plataforma SaaS Corporativa para Gestão de RPG de Mesa

**RoleMaster** é uma solução SaaS corporativa focada em permitir que estúdios, comunidades e equipes de eventos gerenciem campanhas de RPG de mesa com segurança, isolamento de dados e governança.

O sistema foi projetado para suportar múltiplos locatários (multi-tenant), separação de contexto por mesa/campanha e integração com APIs de frontend modernas. A implementação prioriza confiabilidade, auditabilidade e preparo para implantação em nuvem.

---

## 🚀 Visão Técnica e de Negócio

- Produto orientado a SaaS: cada mesa ou campanha funciona como um locatário lógico isolado.
- Arquitetura modular baseada em **Clean Architecture** para reduzir acoplamento e suportar evolução de produto.
- Validação de modelo de domínio centrada em RPG de mesa, com foco em regras de campanha, gestão de fichas e controle de acesso.
- Entregável ideal para MVP de plataforma de gerenciamento de jogos, estúdios de RPG, coletivos de eventos ou operações de community gaming.

---

## 🏗️ Arquitetura do Projeto

O projeto está dividido em camadas consolidadas para escalabilidade e manutenção:

- **`RoleMaster.Core`**: domínio central com entidades, Value Objects, interfaces de abstração e regras de negócio. Depende apenas do próprio domínio.
- **`RoleMaster.Infrastructure`**: persistência de dados com Entity Framework Core, configuração de banco, migrations e filtros globais para isolamento multi-tenant.
- **`RoleMaster.API`**: camada de aplicação e transporte. Exposição de APIs REST, autenticação JWT, middleware de tenant e middleware de validação de contexto.
- **`RoleMaster.Tests`**: testes unitários e de integração leve para garantir comportamento de negócios e segurança de isolamento.

---

## 🔧 Tecnologias e Ferramentas

- **Plataforma:** .NET 8 (.NET SDK atual)
- **Linguagem:** C# 13
- **ORM:** Entity Framework Core 8
- **Banco de Dados:** PostgreSQL (configuração voltada para nuvem)
- **Autenticação:** JWT com políticas de autorização
- **API Docs:** Swagger / OpenAPI
- **Testes:** xUnit, Moq, EF Core InMemory
- **Frontend:** aplicação SPA em `rolemaster-web` (Vite, React)
- **Deploy:** preparado para ambientes de contêiner e nuvem

---

## 🧩 Recursos Empresariais Principais

- Isolamento multi-tenant por mesa/campanha para evitar vazamento de dados entre grupos.
- Controle de acesso com permissões de Mestre e jogador.
- Fluxo de entrada de jogadores: convite por código, solicitação de acesso e aprovação do Mestre.
- Gestão de fichas de personagens (CRUD avançado) com ligação a inventário, magias e recursos da campanha.
- Suporte a conteúdo global e homebrew customizado por campanha.

---

## 💼 Benefícios de Valor para o Cliente

- **Segurança de governança**: dados de cada campanha são tratados como unidades independentes.
- **Escalabilidade**: arquitetura separada permite evolução do produto sem refatoração monolítica.
- **Entrega rápida de MVP**: foco em funcionalidades essenciais para operação de espaços de jogos.
- **Melhor experiência colaborativa**: estruturas de campanha e aprovação de membros suportam grupos organizados.
- **Pronto para cloud**: arquitetura compatível com contêineres e hospedagem de APIs.

---

## 📁 Estrutura do Repositório

- `RoleMaster.API/` — backend ASP.NET Core com controllers, middlewares e configuração de DI.
- `RoleMaster.Core/` — domínio do sistema, entidades, interfaces e lógica de negócio.
- `RoleMaster.Infrastructure/` — persistência de dados, `DbContext`, migrations e filtros multi-tenant.
- `RoleMaster.Tests/` — testes automatizados para validar regras de negócio e contratos de API.
- `rolemaster-web/` — frontend SPA React com Vite para consumo da API.

---

## ⚙️ Operacional e Deploy

- A API está pronta para execução local com `dotnet run` em `RoleMaster.API`.
- O banco de dados deve ser configurado via `appsettings.json` / `appsettings.Development.json`.
- As migrations de EF Core permitem versionamento de esquema e deploy contínuo.
- A arquitetura suporta implantação em contêiner Docker e serviços de nuvem gerenciados.

---

## 📌 Observação

O projeto é uma base sólida para transformação em um produto SaaS completo para RPG de mesa, com ênfase em isolamento de dados, controle de acesso e flexibilidade para expansão futura.

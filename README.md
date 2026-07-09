# 🎲 RoleMaster - SaaS Multi-Tenant para RPG de Mesa

**RoleMaster** é uma plataforma SaaS (Software as a Service) desenvolvida para o gerenciamento de mesas de RPG de mesa. O sistema permite que Mestres criem campanhas isoladas e jogadores gerenciem suas fichas (baseadas em D&D 5e), itens e magias de forma segura e organizada.

O backend foi construído com foco em **Clean Architecture** e **Multi-Tenancy**, garantindo um isolamento estrito de dados entre diferentes mesas e campanhas através de interceptadores no banco de dados.

Desenvolvido como projeto prático e compondo o portfólio pessoal.

---

## 🚀 Tecnologias Utilizadas

- **Framework:** .NET 8 (C#)
- **ORM:** Entity Framework Core 8
- **Banco de Dados:** PostgreSQL (Hospedado na nuvem via Aiven)
- **Autenticação:** JWT (JSON Web Tokens)
- **Testes Automatizados:** xUnit, Moq, EF Core InMemory
- **Documentação de API:** Swagger / OpenAPI

---

## 🏗️ Arquitetura e Estrutura do Projeto

O projeto segue os princípios da **Clean Architecture**, dividindo as responsabilidades em camadas bem definidas para facilitar a manutenção e escalabilidade:

- **`RoleMaster.Core`:** Contém as entidades de domínio (Ficha de Personagem, Mesa, Equipamentos, Magias), Enums e Interfaces (como `ITenantProvider`). É o coração do sistema e não possui dependências externas.
- **`RoleMaster.Infrastructure`:** Responsável pela persistência de dados. Contém o `RoleMasterDbContext` e as configurações do Entity Framework Core, incluindo os _Global Query Filters_ para o isolamento Multi-Tenant.
- **`RoleMaster.API`:** A porta de entrada do sistema. Contém os Controllers, as configurações de injeção de dependência (DI), o Middleware de extração do Tenant (`X-Tenant-ID`) e a autenticação JWT.
- **`RoleMaster.Tests`:** Suíte de testes unitários validando as regras de negócio e a segurança do isolamento de dados das mesas.

---

## 🛡️ Funcionalidades Principais (MVP Backend)

### 1. Autenticação e Segurança

- Registro de novos usuários.
- Login com emissão de token JWT seguro.
- Proteção de rotas da API com o atributo `[Authorize]`.

### 2. Sistema Multi-Tenant (Lobby e Mesas)

- Criação de Mesas (Campanhas), gerando automaticamente um código de convite único.
- Sistema de aprovação: Jogadores solicitam entrada através do código e o Mestre aprova ou recusa a solicitação.
- **Isolamento de Dados:** Todo o acesso a personagens, equipamentos e magias é interceptado por um Middleware que lê o header `X-Tenant-ID`. O Entity Framework aplica um `HasQueryFilter` global para garantir que os dados de uma mesa nunca vazem para outra.
- **Catálogo Híbrido:** Suporte a itens e magias globais do sistema, além de itens customizados restritos a uma mesa específica (Homebrew).

### 3. Gestão de Fichas de Personagem

- CRUD completo de personagens com mais de 50 atributos mapeados (baseado no sistema D&D 5e).
- Relacionamento complexo com Inventário (Equipamentos) e Grimoire (Magias) utilizando o `.Include()` do EF Core.
- Atualização otimizada de dados utilizando `CurrentValues.SetValues()`.

---

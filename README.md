# Sistema de Caixinha para Funcionários

**Versão:** `1.0.0`

Sistema completo de gerenciamento de caixinha com contribuições via cotas, empréstimos e sorteios mensais.

## Características

- **Contribuições via Cotas**: Cada funcionário pode contribuir mensalmente via PIX ou dinheiro
- **Sistema de Empréstimos**: Empréstimos baseados em cotas pagas com juros configuráveis
- **Sorteios Mensais**: Sorteios baseados na loteria federal com números de 1 a 100
- **Painel Administrativo**: Gestão completa de usuários, pagamentos, empréstimos e sorteios
- **Segurança**: Row Level Security (RLS) do Supabase para isolamento de dados

## Tecnologias

- **Frontend**: Next.js 14 (App Router), TypeScript, React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Segurança**: RLS Policies, JWT Authentication

## Estrutura do Projeto

```
caixa-funcionarios/
├── apps/
│   ├── web/              # Aplicação Next.js
│   └── mobile/           # Aplicação Mobile (futuro)
├── packages/
│   └── shared/           # Código compartilhado
└── supabase/
    └── migrations/       # Migrações do banco de dados
```

## Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd caixa-funcionarios
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cd apps/web
cp .env.example .env.local
```

Preencha o `.env.local` com suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Execute as migrações do banco de dados:
```bash
# No Supabase Dashboard, execute os arquivos SQL em:
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_rls_policies.sql
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## Funcionalidades Principais

### 1. Autenticação
- Cadastro de usuários
- Login/Logout
- Recuperação de senha
- Verificação de email

### 2. Gestão de Cotas
- Cadastro único de cotas (número e valor)
- Pagamentos mensais (5º dia útil)
- Upload de comprovantes
- Histórico de pagamentos
- Cálculo automático de juros em atrasos

### 3. Sistema de Empréstimos
- Solicitação baseada em cotas pagas
- Disponível a partir de Janeiro
- Diferentes taxas de juro para cotistas e não-cotistas
- Aprovação via administrador
- Vencimento até Novembro

### 4. Sorteios Mensais
- Sorteio mensal com números de 1 a 100
- Reserva de números por 72 horas
- Integração com resultado da loteria federal
- Prêmio configurável

### 5. Painel Administrativo
- Dashboard com métricas
- Gestão de usuários
- Confirmação de pagamentos
- Aprovação de empréstimos
- Gerenciamento de sorteios
- Configurações do sistema

## Segurança

O sistema implementa Row Level Security (RLS) do Supabase para garantir:
- Usuários veem apenas seus próprios dados
- Administradores veem todos os dados (exceto de outros admins)
- Máximo de 4 administradores simultâneos
- Auditoria de ações administrativas

## Banco de Dados

As migrações estão em `supabase/migrations/`:
- `001_initial_schema.sql`: Criação das tabelas e estruturas
- `002_rls_policies.sql`: Políticas de segurança RLS

## Desenvolvimento

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Lint
npm run lint
```

## Sistema de Versionamento

Este projeto utiliza [Semantic Versioning](https://semver.org/lang/pt-BR/) (SemVer), no formato `MAJOR.MINOR.PATCH` (exemplo: `1.0.0`).

### Comandos Disponíveis

```bash
# Ver versão atual
npm run version

# Incrementar patch (correções de bugs)
npm run version:patch    # 1.0.0 -> 1.0.1

# Incrementar minor (novas funcionalidades)
npm run version:minor    # 1.0.0 -> 1.1.0

# Incrementar major (mudanças breaking)
npm run version:major    # 1.0.0 -> 2.0.0
```

### Arquivos de Versionamento

- `VERSION`: Arquivo de texto simples contendo a versão atual
- `CHANGELOG.md`: Histórico completo de mudanças
- `package.json`: Versão sincronizada automaticamente

### Convenções

- **Correções de bugs**: Incrementar PATCH (ex: `1.0.0` -> `1.0.1`)
- **Novas funcionalidades (backward compatible)**: Incrementar MINOR (ex: `1.0.0` -> `1.1.0`)
- **Mudanças breaking**: Incrementar MAJOR (ex: `1.0.0` -> `2.0.0`)

## Licença

ISC

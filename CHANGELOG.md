# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.3] - 2026-01-21

### Corrigido
- Erro de hidratação causado por extensões do navegador (adicionado suppressHydrationWarning)

### Alterado
- Melhorada a visualização do histórico de escolhas no painel administrativo

### Adicionado (Administradores)
- Histórico de escolhas de sorteios agrupado por usuário
- Visualização completa de números escolhidos com informações detalhadas (nome, email, status, valores)
- Destaque visual para números ganhadores e reservas expiradas
- Estatísticas resumidas por usuário (total de números, confirmados, reservados, valor total)

---

## [1.0.0] - 2026-01-19

### Adicionado
- Sistema inicial de caixinha para funcionários
- Autenticação e autorização de usuários (admin, cotista, não-cotista)
- Gestão de cotas (cadastro, pagamentos, histórico)
- Sistema de empréstimos baseado em cotas pagas
- Sorteios mensais com números de 1 a 100
- Painel administrativo completo
- Row Level Security (RLS) para isolamento de dados
- Dashboard diferenciado para administradores e usuários regulares
- Restrições para administradores (não podem comprar cotas, participar de sorteios ou solicitar empréstimos)

### Estrutura
- Monorepo com apps/web, apps/mobile e packages/shared
- Migrações do Supabase para schema inicial e RLS policies
- Componentes reutilizáveis (Button, Card, Input, Label, Select)
- Hooks customizados (useAuth)
- Validações com Zod

### Tecnologias
- Next.js 16.1.4 (App Router)
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- Supabase (PostgreSQL, Auth, Storage)
- Radix UI para componentes acessíveis

---

## Formato de Versionamento

Este projeto usa [Semantic Versioning](https://semver.org/lang/pt-BR/) (SemVer):
- Formato: `MAJOR.MINOR.PATCH`
- Exemplo: `1.0.0` (versão inicial)

Para atualizações:
- **Correções de bugs**: Incrementar PATCH (ex: `1.0.0` -> `1.0.1`)
- **Novas funcionalidades (backward compatible)**: Incrementar MINOR (ex: `1.0.0` -> `1.1.0`)
- **Mudanças breaking**: Incrementar MAJOR (ex: `1.0.0` -> `2.0.0`)

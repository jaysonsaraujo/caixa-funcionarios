# Simulação: 12 usuários, 12 meses

Script que cria 12 usuários, simula cotas, empréstimos, sorteios ao longo de 12 meses, calcula divisão de lucros e previsão mês a mês, e gera as tabelas de participantes e previsão.

## Pré-requisitos

- Node.js (mesmo ambiente do projeto)
- Variáveis em `apps/web/.env.local` ou na raiz `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL` (ou `SUPABASE_URL`)
  - `SUPABASE_SERVICE_ROLE_KEY`

A **Service Role Key** está em **Supabase Dashboard → Project Settings → API**. Use apenas em ambiente seguro; nunca exponha no front-end.

## Execução

A partir da raiz do projeto:

```bash
npm run seed:simulation -w web
```

Ou, a partir de `apps/web`:

```bash
npm run seed:simulation
```

Ou diretamente:

```bash
cd apps/web && node scripts/seed-simulation-12-users.js
```

## O que o script faz

1. **Cria 12 usuários** no Supabase Auth (`simulacao01@caixa.local` … `simulacao12@caixa.local`), com senhas `Simulacao01!` … `Simulacao12!`, e perfis em `public.users` como `cotista`.
2. **Cotas**: cadastra cotas variadas (número de cotas e valor por cota) para cada usuário.
3. **Pagamentos de cotas**: 12 meses (ano 2024) de parcelas; ~20% simulados como atraso com juro de 5%.
4. **Empréstimos**: vários valores por usuário, cotista/não cotista, parte quitada e parte aprovada.
5. **Sorteios**: 12 sorteios mensais (1–100), bilhetes por usuário, prêmio R$ 1.000/mês, todos marcados como sorteados.
6. **Cálculos**:
   - Receita: cotas (valor + juros) + juros de empréstimos quitados + bilhetes.
   - Despesa: prêmios dos sorteios.
   - Lucro = Receita − Despesa.
   - Participação por usuário = proporcional ao total pago em cotas (valor + juros).
   - **Previsão mês a mês**: para cada mês 1…12, o “valor a sacar na conclusão do ano” é a parte do usuário no lucro acumulado até aquele mês.

## Arquivos gerados

Na **raiz do projeto**:

- **`TABELA_PARTICIPANTES_SIMULACAO.md`**  
  Tabela dos 12 participantes com: #, Nome, E-mail (login), Senha.

- **`PREVISAO_LUCROS_SIMULACAO.md`**  
  - Resumo do ano (receitas, despesa, lucro total).  
  - Tabela “previsão mês a mês” por participante (Jan–Dez + total final).  
  - Totais por mês (receita cotas, empréstimos, bilhetes, despesa prêmios, lucro acumulado).

## Executar apenas uma vez

- O script **não** remove usuários nem dados antigos.
- Se já existirem usuários `*@caixa.local`, a criação pode falhar por e-mail duplicado.
- Sorteios usam `(mes, ano)` com `UNIQUE(mes, ano)`. Se já houver sorteios para 2024, as inserções de sorteio vão falhar.

Recomendado: rodar em banco vazio ou de testes, ou remover antes usuários e dados da simulação (sorteios 2024, quotas/pagamentos/empréstimos/bilhetes desses usuários).

## Exemplo de tabela de participantes (após rodar o script)

| # | Nome            | E-mail (login)              | Senha        |
|---|-----------------|-----------------------------|--------------|
| 1 | Ana Silva       | `simulacao01@caixa.local`   | `Simulacao01!` |
| 2 | Bruno Costa     | `simulacao02@caixa.local`   | `Simulacao02!` |
| … | …               | …                           | …            |
| 12| Marcos Pereira  | `simulacao12@caixa.local`   | `Simulacao12!` |

Os arquivos gerados contêm a tabela completa e a previsão mês a mês.

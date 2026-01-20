# Configuração do Supabase

Este documento descreve os passos necessários para configurar o banco de dados Supabase para o Sistema de Caixinha.

## 1. Criar Projeto Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Crie um novo projeto
4. Anote a URL do projeto e as chaves de API

## 2. Executar Migrações

No Supabase Dashboard, vá em SQL Editor e execute os arquivos na ordem:

1. `supabase/migrations/001_initial_schema.sql` - Cria todas as tabelas e estruturas
2. `supabase/migrations/002_rls_policies.sql` - Configura as políticas de segurança RLS

## 3. Configurar Storage para Comprovantes

1. No Supabase Dashboard, vá em **Storage**
2. Clique em **Create a new bucket**
3. Nome do bucket: `comprovantes`
4. Marque como **Public bucket** (se desejar que os comprovantes sejam públicos) ou deixe privado
5. Configure as políticas RLS conforme necessário

### Política RLS para Storage (opcional)

Se o bucket for privado, você pode criar políticas RLS:

```sql
-- Permitir que usuários façam upload de seus próprios comprovantes
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permitir que usuários leiam seus próprios comprovantes
CREATE POLICY "Users can read their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permitir que admins leiam todos os comprovantes
CREATE POLICY "Admins can read all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## 4. Configurar Primeiro Administrador

Após criar sua conta de usuário, execute no SQL Editor:

```sql
-- Substitua 'seu-email@exemplo.com' pelo email do primeiro admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

**Importante**: Certifique-se de que há no máximo 4 administradores conforme a regra de negócio.

## 5. Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. Testar Configuração

1. Acesse a aplicação
2. Crie uma conta de usuário
3. Verifique se o perfil foi criado automaticamente na tabela `users`
4. Teste o login e funcionalidades básicas

## Troubleshooting

### Erro ao criar perfil de usuário

Verifique se o trigger `on_auth_user_created` foi criado corretamente na migração 001.

### Erro de permissão RLS

Verifique se as políticas RLS foram aplicadas corretamente na migração 002.

### Erro ao fazer upload de arquivo

Verifique se o bucket `comprovantes` foi criado e se as políticas de storage estão configuradas.

## Funções Úteis

### Contar Administradores

```sql
SELECT COUNT(*) FROM public.users WHERE role = 'admin';
```

### Ver Logs de Ações Administrativas

```sql
SELECT * FROM public.admin_actions_log
ORDER BY timestamp DESC
LIMIT 100;
```

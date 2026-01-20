# Usuários para Testes

## Como criar os usuários de teste

### Opção 1: Criar via Interface do Supabase (Recomendado)

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** > **Users**
4. Clique em **Add user** > **Create new user**
5. Crie os seguintes usuários:

#### Administrador
- **Email**: `admin@teste.com`
- **Senha**: `admin123456`
- **Auto Confirm User**: ✅ (ativar)

Depois de criar, vá em **Table Editor** > **users** e atualize o campo `role` para `admin`.

#### Usuário (Cotista)
- **Email**: `usuario@teste.com`
- **Senha**: `usuario123456`
- **Auto Confirm User**: ✅ (ativar)

Depois de criar, vá em **Table Editor** > **users** e atualize o campo `role` para `cotista`.

### Opção 2: Criar via Aplicação

1. Acesse `http://192.168.0.13:3000/signup`
2. Crie o usuário normalmente
3. Após criar, execute no SQL Editor do Supabase para atualizar o role:

```sql
-- Para admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@teste.com';

-- Para cotista
UPDATE public.users 
SET role = 'cotista' 
WHERE email = 'usuario@teste.com';
```

## Credenciais dos Usuários

### Administrador
- **Email**: `admin@teste.com`
- **Senha**: `admin123456`
- **Role**: `admin`

### Usuário (Cotista)
- **Email**: `usuario@teste.com`
- **Senha**: `usuario123456`
- **Role**: `cotista`

## Verificar se os usuários foram criados

Execute no SQL Editor do Supabase:

```sql
SELECT id, email, full_name, role, created_at 
FROM public.users 
WHERE email IN ('admin@teste.com', 'usuario@teste.com')
ORDER BY email;
```

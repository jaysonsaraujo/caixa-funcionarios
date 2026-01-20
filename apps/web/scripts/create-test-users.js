const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ubklczzcuoaqquqxwnqd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia2xjenpjdW9hcXF1cXh3bnFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3MzI0OSwiZXhwIjoyMDg0NDQ5MjQ5fQ.MR15XJ4DwXW3_4q3kZqY9QqQJxQqQJxQqQJxQqQJxQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createUsers() {
  console.log('Criando usuários de teste...\n')

  // Criar admin
  console.log('1. Criando administrador...')
  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email: 'admin@teste.com',
    password: 'admin123456',
    email_confirm: true,
    user_metadata: {
      full_name: 'Administrador Teste'
    }
  })

  if (adminError) {
    console.error('Erro ao criar admin:', adminError.message)
  } else {
    console.log('✅ Admin criado:', adminData.user.email)
    
    // Atualizar role para admin
    const { error: roleError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', adminData.user.id)
    
    if (roleError) {
      console.error('Erro ao atualizar role do admin:', roleError.message)
    } else {
      console.log('✅ Role do admin atualizado para "admin"\n')
    }
  }

  // Criar usuário
  console.log('2. Criando usuário...')
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'usuario@teste.com',
    password: 'usuario123456',
    email_confirm: true,
    user_metadata: {
      full_name: 'Usuário Teste'
    }
  })

  if (userError) {
    console.error('Erro ao criar usuário:', userError.message)
  } else {
    console.log('✅ Usuário criado:', userData.user.email)
    
    // Atualizar role para cotista
    const { error: roleError } = await supabase
      .from('users')
      .update({ role: 'cotista' })
      .eq('id', userData.user.id)
    
    if (roleError) {
      console.error('Erro ao atualizar role do usuário:', roleError.message)
    } else {
      console.log('✅ Role do usuário atualizado para "cotista"\n')
    }
  }

  console.log('\n✅ Usuários criados com sucesso!')
  console.log('\nCredenciais:')
  console.log('Admin:')
  console.log('  Email: admin@teste.com')
  console.log('  Senha: admin123456')
  console.log('\nUsuário:')
  console.log('  Email: usuario@teste.com')
  console.log('  Senha: usuario123456')
}

createUsers().catch(console.error)

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { SystemConfig } from '@/components/admin/SystemConfig'

export default async function AdminConfiguracoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações do Sistema</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ajuste parâmetros e configurações gerais do sistema
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Parâmetros do Sistema</CardTitle>
          <CardDescription>
            Configure valores de cotas, juros de empréstimos e outros parâmetros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SystemConfig />
        </CardContent>
      </Card>
    </div>
  )
}

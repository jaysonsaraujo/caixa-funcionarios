import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { PaymentsManagement } from '@/components/admin/PaymentsManagement'

export default async function AdminPagamentosPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Pagamentos</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Confirme e gerencie pagamentos de cotas pendentes
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Pagamentos Aguardando Confirmação</CardTitle>
          <CardDescription>
            Revise e confirme os pagamentos enviados pelos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsManagement />
        </CardContent>
      </Card>
    </div>
  )
}

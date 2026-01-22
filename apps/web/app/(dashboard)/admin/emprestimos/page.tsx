import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { LoansManagement } from '@/components/admin/LoansManagement'

export default async function AdminEmprestimosPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Empréstimos</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Aprove ou rejeite solicitações de empréstimo dos usuários
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Solicitações Pendentes</CardTitle>
          <CardDescription>
            Revise e gerencie as solicitações de empréstimo pendentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoansManagement />
        </CardContent>
      </Card>
    </div>
  )
}

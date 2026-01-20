import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { UsersManagement } from '@/components/admin/UsersManagement'
import { PaymentsManagement } from '@/components/admin/PaymentsManagement'
import { LoansManagement } from '@/components/admin/LoansManagement'
import { RafflesManagement } from '@/components/admin/RafflesManagement'
import { SystemConfig } from '@/components/admin/SystemConfig'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Redirecionar admin para o dashboard (que agora é o painel administrativo)
  if (profile?.role === 'admin') {
    redirect('/dashboard')
  }

  // Se não for admin, redirecionar para dashboard
  redirect('/dashboard')
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie usuários, pagamentos, empréstimos e sorteios
        </p>
      </div>

      <AdminDashboard />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gestão de Usuários</CardTitle>
            <CardDescription>Visualize e gerencie usuários do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <UsersManagement />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos</CardTitle>
            <CardDescription>Confirme pagamentos pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentsManagement />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empréstimos</CardTitle>
            <CardDescription>Aprove ou rejeite solicitações de empréstimo</CardDescription>
          </CardHeader>
          <CardContent>
            <LoansManagement />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sorteios</CardTitle>
            <CardDescription>Gerencie sorteios mensais</CardDescription>
          </CardHeader>
          <CardContent>
            <RafflesManagement />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Configurações do Sistema</CardTitle>
            <CardDescription>Ajuste parâmetros do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <SystemConfig />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

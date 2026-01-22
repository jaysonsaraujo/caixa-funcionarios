import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { RafflesManagement } from '@/components/admin/RafflesManagement'

export default async function AdminSorteiosPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Sorteios</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Gerencie sorteios mensais e visualize histórico de escolhas
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Sorteio do Mês</CardTitle>
          <CardDescription>
            Realize sorteios e visualize as escolhas dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RafflesManagement />
        </CardContent>
      </Card>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/shared/Button'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { UsersManagement } from '@/components/admin/UsersManagement'
import { PaymentsManagement } from '@/components/admin/PaymentsManagement'
import { LoansManagement } from '@/components/admin/LoansManagement'
import { RafflesManagement } from '@/components/admin/RafflesManagement'
import { SystemConfig } from '@/components/admin/SystemConfig'

export default async function DashboardPage() {
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

  const isAdmin = profile?.role === 'admin'

  // Buscar dados do usuário (apenas se não for admin)
  const quotaResult = !isAdmin
    ? await supabase
        .from('quotas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ativa')
        .single()
    : { data: null, error: null }
  const quota = quotaResult.data

  const pendingPaymentsResult = !isAdmin && quota
    ? await supabase
        .from('quota_payments')
        .select('*')
        .eq('quota_id', quota.id)
        .in('status', ['pendente', 'aguardando_confirmacao'])
        .order('data_vencimento', { ascending: true })
        .limit(5)
    : { data: null, error: null }
  const pendingPayments = pendingPaymentsResult.data

  const loansResult = !isAdmin
    ? await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pendente', 'aprovado'])
        .order('data_solicitacao', { ascending: false })
        .limit(5)
    : { data: null, error: null }
  const loans = loansResult.data

  const currentRaffleResult = !isAdmin
    ? await supabase
        .from('monthly_raffles')
        .select('*')
        .eq('status', 'aberto')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    : { data: null, error: null }
  const currentRaffle = currentRaffleResult.data

  const myTicketsResult = !isAdmin && currentRaffle
    ? await supabase
        .from('raffle_tickets')
        .select('*')
        .eq('raffle_id', currentRaffle.id)
        .eq('user_id', user.id)
        .eq('status', 'confirmado')
    : { data: null, error: null }
  const myTickets = myTicketsResult.data

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <>
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
        </>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Bem-vindo, {profile?.full_name || user.email}
            </p>
          </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quota && (
            <Card>
              <CardHeader>
                <CardTitle>Minhas Cotas</CardTitle>
                <CardDescription>Informações sobre suas cotas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{quota.num_cotas} cotas</p>
                  <p className="text-sm text-gray-600">
                    Valor por cota: {formatCurrency(quota.valor_por_cota)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: {formatCurrency(quota.num_cotas * quota.valor_por_cota)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Pendentes</CardTitle>
              <CardDescription>Próximos vencimentos</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments && pendingPayments.length > 0 ? (
                <div className="space-y-2">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="text-sm">
                      <p>
                        {formatCurrency(payment.valor_pago)} - Vence em{' '}
                        {formatDate(payment.data_vencimento)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Nenhum pagamento pendente</p>
              )}
              <Link href="/cotas">
                <Button variant="outline" className="mt-4 w-full">
                  Ver todas as cotas
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empréstimos</CardTitle>
              <CardDescription>Status dos seus empréstimos</CardDescription>
            </CardHeader>
            <CardContent>
              {loans && loans.length > 0 ? (
                <div className="space-y-2">
                  {loans.map((loan) => (
                    <div key={loan.id} className="text-sm">
                      <p>{formatCurrency(loan.valor_solicitado)}</p>
                      <p className="text-gray-600">Status: {loan.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Nenhum empréstimo ativo</p>
              )}
              <Link href="/emprestimos">
                <Button variant="outline" className="mt-4 w-full">
                  Ver empréstimos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {currentRaffle && (
            <Card>
              <CardHeader>
                <CardTitle>Sorteio do Mês</CardTitle>
                <CardDescription>
                  {new Date(currentRaffle.ano, currentRaffle.mes - 1).toLocaleString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">
                    Prêmio: {formatCurrency(currentRaffle.premio_valor)}
                  </p>
                  {myTickets && myTickets.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Seus números: {myTickets.map((t) => t.numero_escolhido).join(', ')}
                    </p>
                  )}
                </div>
                <Link href="/sorteios">
                  <Button variant="outline" className="mt-4 w-full">
                    Participar do sorteio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
        </>
      )}
    </div>
  )
}

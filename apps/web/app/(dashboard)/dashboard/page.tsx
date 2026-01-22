import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { StatCard } from '@/components/shared/StatCard'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/shared/Button'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Administrativo</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Visão geral do sistema - Acesse as seções específicas pelo menu de navegação
            </p>
          </div>

          <AdminDashboard />
        </>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Bem-vindo, {profile?.full_name || user.email}
            </p>
          </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quota && (
            <Card variant="gradient" className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Minhas Cotas</CardTitle>
                    <CardDescription className="text-white/80">
                      {formatCurrency(quota.valor_por_cota)} por cota
                    </CardDescription>
                  </div>
                  <div className="rounded-lg p-3 bg-white/20">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white mb-2">{quota.num_cotas} cotas</p>
                <p className="text-sm text-white/90 mb-4">
                  Total mensal: {formatCurrency(quota.num_cotas * quota.valor_por_cota)}
                </p>
                <Link href="/cotas">
                  <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 font-semibold w-full border border-gray-200 dark:border-gray-300">
                    Ver detalhes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Pagamentos Pendentes</CardTitle>
              <CardDescription>Próximos vencimentos</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments && pendingPayments.length > 0 ? (
                <div className="space-y-3">
                  {pendingPayments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(payment.valor_pago)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Vence em {formatDate(payment.data_vencimento)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {pendingPayments.length > 3 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{pendingPayments.length - 3} mais
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Nenhum pagamento pendente</p>
              )}
              <Link href="/cotas">
                <Button variant="outline" className="mt-4 w-full">
                  Ver todas as cotas
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Empréstimos</CardTitle>
              <CardDescription>Status dos seus empréstimos</CardDescription>
            </CardHeader>
            <CardContent>
              {loans && loans.length > 0 ? (
                <div className="space-y-3">
                  {loans.slice(0, 2).map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(loan.valor_solicitado)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 capitalize">
                          Status: {loan.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {loans.length > 2 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{loans.length - 2} mais
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">Nenhum empréstimo ativo</p>
              )}
              <Link href="/emprestimos">
                <Button variant="outline" className="mt-4 w-full">
                  Ver empréstimos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {currentRaffle && (
            <Card variant="gradient" className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Sorteio do Mês</CardTitle>
                    <CardDescription className="text-white/80">
                      {new Date(currentRaffle.ano, currentRaffle.mes - 1).toLocaleString('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  <div className="rounded-lg p-3 bg-white/20">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(currentRaffle.premio_valor)}
                </p>
                {myTickets && myTickets.length > 0 && (
                  <p className="text-sm text-white/90 mb-4">
                    Seus números: {myTickets.map((t) => t.numero_escolhido).join(', ')}
                  </p>
                )}
                <Link href="/sorteios">
                  <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 font-semibold w-full border border-gray-200 dark:border-gray-300">
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

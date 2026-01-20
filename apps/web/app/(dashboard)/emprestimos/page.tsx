import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LoanRequestForm } from '@/components/emprestimos/LoanRequestForm'
import { LoansList } from '@/components/emprestimos/LoansList'

export default async function EmprestimosPage() {
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

  const { data: quota } = await supabase
    .from('quotas')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ativa')
    .single()

  // Verificar se já tem pagamentos realizados (necessário para empréstimo)
  const paidPaymentsResult = quota
    ? await supabase
        .from('quota_payments')
        .select('*')
        .eq('quota_id', quota.id)
        .eq('status', 'pago')
        .limit(1)
    : { data: null, error: null }
  
  const paidPayments = paidPaymentsResult.data

  const canRequestLoan = quota && paidPayments && paidPayments.length > 0

  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', user.id)
    .order('data_solicitacao', { ascending: false })

  const { data: systemConfig } = await supabase
    .from('system_config')
    .select('*')
    .single()

  const isAdmin = profile?.role === 'admin'

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empréstimos</h1>
          <p className="mt-2 text-sm text-gray-600">
            Solicite empréstimos baseados em suas cotas pagas
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Administradores não podem solicitar empréstimos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Como administrador, você não pode solicitar empréstimos. Esta funcionalidade é exclusiva para usuários regulares (cotistas e não cotistas).
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCotista = profile?.role === 'cotista'
  const juroEmprestimo = isCotista
    ? systemConfig?.juro_emprestimo_cotista || 3
    : systemConfig?.juro_emprestimo_nao_cotista || 5

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Empréstimos</h1>
        <p className="mt-2 text-sm text-gray-600">
          Solicite empréstimos baseados em suas cotas pagas
        </p>
      </div>

      {canRequestLoan && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitar Empréstimo</CardTitle>
            <CardDescription>
              Você pode solicitar empréstimos a partir de Janeiro, após realizar seu primeiro
              pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoanRequestForm
              isCotista={isCotista}
              juroEmprestimo={juroEmprestimo}
              maxValue={quota.num_cotas * quota.valor_por_cota}
            />
          </CardContent>
        </Card>
      )}

      {!canRequestLoan && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitar Empréstimo</CardTitle>
            <CardDescription>Não é possível solicitar empréstimo no momento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {!quota
                ? 'Você precisa ter cotas cadastradas para solicitar um empréstimo.'
                : 'Você precisa ter realizado pelo menos um pagamento para solicitar um empréstimo.'}
            </p>
          </CardContent>
        </Card>
      )}

      {loans && loans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meus Empréstimos</CardTitle>
            <CardDescription>Histórico de empréstimos solicitados</CardDescription>
          </CardHeader>
          <CardContent>
            <LoansList loans={loans} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

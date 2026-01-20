import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { formatCurrency, formatDate, getNthBusinessDay } from '@/lib/utils'
import Link from 'next/link'
import { RegisterQuotaForm } from '@/components/cotas/RegisterQuotaForm'
import { QuotaPaymentsList } from '@/components/cotas/QuotaPaymentsList'

export default async function CotasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: quota } = await supabase
    .from('quotas')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const paymentsResult = quota
    ? await supabase
        .from('quota_payments')
        .select('*')
        .eq('quota_id', quota.id)
        .order('ano_referencia', { ascending: false })
        .order('mes_referencia', { ascending: false })
    : { data: null, error: null }
  
  const payments = paymentsResult.data

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Cotas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gerencie suas contribuições mensais
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Administradores não podem comprar cotas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Como administrador, você não pode comprar cotas. Esta funcionalidade é exclusiva para usuários regulares (cotistas e não cotistas).
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: systemConfig } = await supabase
    .from('system_config')
    .select('*')
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Minhas Cotas</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie suas contribuições mensais
        </p>
      </div>

      {!quota ? (
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Cotas</CardTitle>
            <CardDescription>
              Você ainda não possui cotas cadastradas. Faça seu cadastro agora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterQuotaForm valorMinimoCota={systemConfig?.valor_minimo_cota || 50} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações das Cotas</CardTitle>
              <CardDescription>Detalhes da sua contribuição</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Número de Cotas</p>
                  <p className="text-2xl font-bold">{quota.num_cotas}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor por Cota</p>
                  <p className="text-2xl font-bold">{formatCurrency(quota.valor_por_cota)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total Mensal</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(quota.num_cotas * quota.valor_por_cota)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Data de Cadastro</p>
                  <p className="text-lg">{formatDate(quota.data_cadastro)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-lg">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        quota.status === 'ativa'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {quota.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {payments && payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>Pagamentos realizados e pendentes</CardDescription>
              </CardHeader>
              <CardContent>
                <QuotaPaymentsList payments={payments} quota={quota} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { formatCurrency, formatDate, getNthBusinessDay } from '@/lib/utils'
import Link from 'next/link'
import { RegisterQuotaForm } from '@/components/cotas/RegisterQuotaForm'
import { QuotaPaymentsList } from '@/components/cotas/QuotaPaymentsList'
import { AddQuotasForm } from '@/components/cotas/AddQuotasForm'
import { CancelQuotaForm } from '@/components/cotas/CancelQuotaForm'

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
        <Card variant="elevated">
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Minhas Cotas</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Gerencie suas contribuições mensais
        </p>
      </div>

      {!quota ? (
        <Card variant="elevated">
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
          <Card variant="elevated" className="relative overflow-hidden border-2 border-primary/20 dark:border-primary/30">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent dark:from-primary/20 dark:via-accent/10 border-b border-primary/10 dark:border-primary/20">
              <CardTitle className="text-gray-900 dark:text-white">Informações das Cotas</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">Detalhes da sua contribuição</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-gradient-to-br from-primary/10 to-accent/5 dark:from-primary/20 dark:to-accent/10 rounded-xl p-5 border border-primary/20 dark:border-primary/30">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Número de Cotas</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{quota.num_cotas}</p>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-accent/5 dark:from-primary/20 dark:to-accent/10 rounded-xl p-5 border border-primary/20 dark:border-primary/30">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor por Cota</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(quota.valor_por_cota)}</p>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-accent/5 dark:from-primary/20 dark:to-accent/10 rounded-xl p-5 border border-primary/20 dark:border-primary/30">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor Total Mensal</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(quota.num_cotas * quota.valor_por_cota)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-accent/5 dark:from-primary/20 dark:to-accent/10 rounded-xl p-5 border border-primary/20 dark:border-primary/30">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data de Cadastro</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-2">{formatDate(quota.data_cadastro)}</p>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-accent/5 dark:from-primary/20 dark:to-accent/10 rounded-xl p-5 border border-primary/20 dark:border-primary/30">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</p>
                  <p className="text-lg mt-2">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        quota.status === 'ativa'
                          ? 'bg-green-500 text-white dark:bg-green-600'
                          : 'bg-gray-500 text-white dark:bg-gray-600'
                      }`}
                    >
                      {quota.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {quota.status === 'ativa' && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Adicionar Mais Cotas</CardTitle>
                  <CardDescription>
                    Aumente o número de suas cotas para aumentar sua participação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AddQuotasForm
                    currentQuotas={quota.num_cotas}
                    valorPorCota={quota.valor_por_cota}
                    quotaId={quota.id}
                  />
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Cancelar Cotas</CardTitle>
                  <CardDescription>
                    Cancele suas cotas (apenas se não houver pagamentos pendentes)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CancelQuotaForm
                    quotaId={quota.id}
                    numCotas={quota.num_cotas}
                    valorPorCota={quota.valor_por_cota}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {payments && payments.length > 0 && (
            <Card variant="elevated">
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

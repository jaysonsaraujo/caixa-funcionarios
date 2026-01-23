'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/shared/Button'

interface UserRecord {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'cotista' | 'nao_cotista'
}

interface MonthlyTotals {
  cotas: number
  sorteios: number
  juros: number
  total: number
}

interface UserSummary {
  user: UserRecord
  months: MonthlyTotals[]
  totalAno: number
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function UserRevenueHistory() {
  const [year, setYear] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<UserSummary[]>([])
  const supabase = createClient()

  const resolveYear = useCallback(async () => {
    const { data } = await supabase
      .from('monthly_raffles')
      .select('ano')
      .order('ano', { ascending: false })
      .limit(1)

    return data?.[0]?.ano ?? new Date().getFullYear()
  }, [supabase])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    const resolvedYear = year ?? (await resolveYear())

    if (year === null) {
      setYear(resolvedYear)
    }

    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .neq('role', 'admin')
      .order('full_name', { ascending: true })

    const users = usersData || []
    if (users.length === 0) {
      setSummaries([])
      setLoading(false)
      return
    }

    const userIds = users.map((u) => u.id)

    const { data: quotasData } = await supabase
      .from('quotas')
      .select('id, user_id')
      .in('user_id', userIds)

    const quotaIdToUser = new Map<string, string>()
    ;(quotasData || []).forEach((q) => quotaIdToUser.set(q.id, q.user_id))

    const quotaIds = (quotasData || []).map((q) => q.id)
    const paymentsData =
      quotaIds.length > 0
        ? (
            await supabase
              .from('quota_payments')
              .select('quota_id, valor_pago, juro_aplicado, mes_referencia, ano_referencia, status')
              .eq('ano_referencia', resolvedYear)
              .eq('status', 'pago')
              .in('quota_id', quotaIds)
          ).data
        : []

    const { data: rafflesData } = await supabase
      .from('monthly_raffles')
      .select('id, mes, ano')
      .eq('ano', resolvedYear)

    const raffleIdToMonth = new Map<string, number>()
    ;(rafflesData || []).forEach((r) => raffleIdToMonth.set(r.id, r.mes))

    const raffleIds = (rafflesData || []).map((r) => r.id)
    const ticketsData =
      raffleIds.length > 0
        ? (
            await supabase
              .from('raffle_tickets')
              .select('raffle_id, user_id, valor_pago, status, pagamento_status')
              .in('raffle_id', raffleIds)
          ).data
        : []

    const { data: loansData } = await supabase
      .from('loans')
      .select('user_id, valor_solicitado, valor_total_devolver, data_vencimento, status')
      .eq('status', 'quitado')
      .in('user_id', userIds)
      .gte('data_vencimento', `${resolvedYear}-01-01`)
      .lte('data_vencimento', `${resolvedYear}-12-31`)

    const baseMonths = Array.from({ length: 12 }, () => ({
      cotas: 0,
      sorteios: 0,
      juros: 0,
      total: 0,
    }))

    const monthByUser = new Map<string, MonthlyTotals[]>(
      users.map((user) => [user.id, baseMonths.map((m) => ({ ...m }))])
    )

    ;(paymentsData || []).forEach((payment: any) => {
      const userId = quotaIdToUser.get(payment.quota_id)
      if (!userId) return
      const monthIndex = Number(payment.mes_referencia) - 1
      if (monthIndex < 0 || monthIndex > 11) return
      const value =
        Number(payment.valor_pago || 0) + Number(payment.juro_aplicado || 0)
      const months = monthByUser.get(userId)
      if (!months) return
      months[monthIndex].cotas += value
    })

    ;(ticketsData || []).forEach((ticket: any) => {
      const month = raffleIdToMonth.get(ticket.raffle_id)
      if (!month) return
      const monthIndex = month - 1
      if (monthIndex < 0 || monthIndex > 11) return
      const paid = ticket.pagamento_status === 'pago' || ticket.status === 'confirmado'
      if (!paid) return
      const months = monthByUser.get(ticket.user_id)
      if (!months) return
      months[monthIndex].sorteios += Number(ticket.valor_pago || 0)
    })

    ;(loansData || []).forEach((loan: any) => {
      if (!loan.data_vencimento) return
      const dataVenc = new Date(loan.data_vencimento)
      const monthIndex = dataVenc.getMonth()
      if (monthIndex < 0 || monthIndex > 11) return
      const juros = Number(loan.valor_total_devolver || 0) - Number(loan.valor_solicitado || 0)
      if (juros <= 0) return
      const months = monthByUser.get(loan.user_id)
      if (!months) return
      months[monthIndex].juros += juros
    })

    const summariesData: UserSummary[] = users.map((user) => {
      const months = monthByUser.get(user.id) || baseMonths
      months.forEach((month) => {
        month.total = month.cotas + month.sorteios + month.juros
      })
      const totalAno = months.reduce((sum, m) => sum + m.total, 0)
      return { user, months, totalAno }
    })

    setSummaries(summariesData)
    setLoading(false)
  }, [resolveYear, supabase, year])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Histórico mês a mês das arrecadações por usuário.</span>
        <div className="flex items-center gap-2">
          <span className="text-xs">Ano: {year ?? '...'}</span>
          <Button size="sm" variant="outline" onClick={loadHistory} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">Carregando histórico...</div>
      ) : summaries.length === 0 ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">Nenhum dado encontrado.</div>
      ) : (
        <div className="space-y-4">
          {summaries.map((summary) => (
            <div
              key={summary.user.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {summary.user.full_name || summary.user.email}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{summary.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total no ano</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalAno)}
                  </p>
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="text-left text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="py-2 pr-4">Mês</th>
                      <th className="py-2 pr-4">Cotas</th>
                      <th className="py-2 pr-4">Sorteios</th>
                      <th className="py-2 pr-4">Juros Empréstimos</th>
                      <th className="py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-200">
                    {summary.months.map((month, index) => (
                      <tr key={`${summary.user.id}-${index}`} className="border-t border-gray-100 dark:border-gray-700/60">
                        <td className="py-2 pr-4 font-medium">{MONTH_LABELS[index]}</td>
                        <td className="py-2 pr-4">{formatCurrency(month.cotas)}</td>
                        <td className="py-2 pr-4">{formatCurrency(month.sorteios)}</td>
                        <td className="py-2 pr-4">{formatCurrency(month.juros)}</td>
                        <td className="py-2 font-semibold">{formatCurrency(month.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

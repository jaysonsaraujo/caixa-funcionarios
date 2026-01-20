'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { formatCurrency } from '@/lib/utils'

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCotistas: 0,
    totalArrecadado: 0,
    totalEmprestimos: 0,
    sorteioMes: null as any,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadStats = async () => {
      const hoje = new Date()
      const mesAtual = hoje.getMonth() + 1
      const anoAtual = hoje.getFullYear()

      // Total de usuários
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'admin')

      // Total de cotistas
      const { count: totalCotistas } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'cotista')

      // Total arrecadado (pagamentos pagos)
      const { data: payments } = await supabase
        .from('quota_payments')
        .select('valor_pago')
        .eq('status', 'pago')

      const totalArrecadado =
        payments?.reduce((sum, p) => sum + Number(p.valor_pago), 0) || 0

      // Total de empréstimos aprovados
      const { data: loans } = await supabase
        .from('loans')
        .select('valor_solicitado')
        .eq('status', 'aprovado')

      const totalEmprestimos =
        loans?.reduce((sum, l) => sum + Number(l.valor_solicitado), 0) || 0

      // Sorteio do mês
      const { data: raffle } = await supabase
        .from('monthly_raffles')
        .select('*')
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .single()

      setStats({
        totalUsers: totalUsers || 0,
        totalCotistas: totalCotistas || 0,
        totalArrecadado,
        totalEmprestimos,
        sorteioMes: raffle,
      })
      setLoading(false)
    }

    loadStats()
  }, [supabase])

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total de Usuários</CardTitle>
          <CardDescription>Usuários cadastrados (exceto admins)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cotistas</CardTitle>
          <CardDescription>Usuários com cotas ativas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalCotistas}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Arrecadado</CardTitle>
          <CardDescription>Valor total de pagamentos confirmados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalArrecadado)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empréstimos Ativos</CardTitle>
          <CardDescription>Valor total de empréstimos aprovados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalEmprestimos)}</p>
        </CardContent>
      </Card>
    </div>
  )
}

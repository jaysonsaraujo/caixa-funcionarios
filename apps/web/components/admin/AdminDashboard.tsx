'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { StatCard } from '@/components/shared/StatCard'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/shared/Button'

interface Stats {
  totalUsers: number
  totalCotistas: number
  totalArrecadado: number
  totalArrecadadoMes: number
  totalArrecadadoAno: number
  totalEmprestimos: number
  totalEmprestimosMes: number
  pagamentosPendentes: number
  emprestimosPendentes: number
  sorteioMes: any
  referenciaMes: number
  referenciaAno: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCotistas: 0,
    totalArrecadado: 0,
    totalArrecadadoMes: 0,
    totalArrecadadoAno: 0,
    totalEmprestimos: 0,
    totalEmprestimosMes: 0,
    pagamentosPendentes: 0,
    emprestimosPendentes: 0,
    sorteioMes: null,
    referenciaMes: new Date().getMonth() + 1,
    referenciaAno: new Date().getFullYear(),
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

      // Total arrecadado (todos os tempos)
      const { data: paymentsAll } = await supabase
        .from('quota_payments')
        .select('valor_pago, mes_referencia, ano_referencia')
        .eq('status', 'pago')

      const totalArrecadado =
        paymentsAll?.reduce((sum, p) => sum + Number(p.valor_pago), 0) || 0

      // Arrecadação do mês/ano são calculados após definir referência

      // Pagamentos pendentes
      const { count: pagamentosPendentes } = await supabase
        .from('quota_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aguardando_confirmacao')

      // Total de empréstimos aprovados/quitados (todos os tempos)
      const { data: loansAll } = await supabase
        .from('loans')
        .select('valor_solicitado, data_solicitacao, status')
        .in('status', ['aprovado', 'quitado'])

      const totalEmprestimos =
        loansAll?.reduce((sum, l) => sum + Number(l.valor_solicitado), 0) || 0

      // Sorteio mais recente (para referência)
      const { data: rafflesLatest } = await supabase
        .from('monthly_raffles')
        .select('*')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(1)

      const latestRaffle = rafflesLatest?.[0] ?? null

      const referenciaPeriodos: Array<{ ano: number; mes: number }> = []
      paymentsAll?.forEach((p) => {
        referenciaPeriodos.push({ ano: p.ano_referencia, mes: p.mes_referencia })
      })
      loansAll?.forEach((l) => {
        if (!l.data_solicitacao) return
        const d = new Date(l.data_solicitacao)
        referenciaPeriodos.push({ ano: d.getFullYear(), mes: d.getMonth() + 1 })
      })
      if (latestRaffle) {
        referenciaPeriodos.push({ ano: latestRaffle.ano, mes: latestRaffle.mes })
      }

      const referenciaOrdenada = referenciaPeriodos.sort((a, b) => {
        if (a.ano !== b.ano) return b.ano - a.ano
        return b.mes - a.mes
      })
      const referencia = referenciaOrdenada[0] || { ano: anoAtual, mes: mesAtual }

      // Arrecadação do mês de referência
      const totalArrecadadoMes =
        paymentsAll
          ?.filter(
            (p) => p.mes_referencia === referencia.mes && p.ano_referencia === referencia.ano
          )
          .reduce((sum, p) => sum + Number(p.valor_pago), 0) || 0

      // Arrecadação do ano de referência
      const totalArrecadadoAno =
        paymentsAll
          ?.filter((p) => p.ano_referencia === referencia.ano)
          .reduce((sum, p) => sum + Number(p.valor_pago), 0) || 0

      // Empréstimos aprovados/quitados no mês de referência
      const totalEmprestimosMes =
        loansAll
          ?.filter((l) => {
            if (!l.data_solicitacao) return false
            const dataSolicitacao = new Date(l.data_solicitacao)
            return (
              dataSolicitacao.getMonth() + 1 === referencia.mes &&
              dataSolicitacao.getFullYear() === referencia.ano
            )
          })
          .reduce((sum, l) => sum + Number(l.valor_solicitado), 0) || 0

      // Empréstimos pendentes
      const { count: emprestimosPendentes } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente')

      setStats({
        totalUsers: totalUsers || 0,
        totalCotistas: totalCotistas || 0,
        totalArrecadado,
        totalArrecadadoMes,
        totalArrecadadoAno,
        totalEmprestimos,
        totalEmprestimosMes,
        pagamentosPendentes: pagamentosPendentes || 0,
        emprestimosPendentes: emprestimosPendentes || 0,
        sorteioMes: latestRaffle,
        referenciaMes: referencia.mes,
        referenciaAno: referencia.ano,
      })
      setLoading(false)
    }

    loadStats()
  }, [supabase])

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Carregando estatísticas...</div>
  }

  const mesReferencia = new Date(stats.referenciaAno, stats.referenciaMes - 1).toLocaleString(
    'pt-BR',
    { month: 'long', year: 'numeric' }
  )

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Visão Geral</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Usuários"
            value={stats.totalUsers}
            description="Usuários cadastrados (exceto admins)"
            variant="primary"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Cotistas"
            value={stats.totalCotistas}
            description="Usuários com cotas ativas"
            variant="success"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Arrecadado"
            value={formatCurrency(stats.totalArrecadado)}
            description="Valor total histórico"
            variant="info"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Empréstimos Ativos"
            value={formatCurrency(stats.totalEmprestimos)}
            description="Valor total aprovado"
            variant="warning"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Estatísticas Mensais */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Estatísticas de {mesReferencia}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Referência: {mesReferencia}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Arrecadação do Mês"
            value={formatCurrency(stats.totalArrecadadoMes)}
            description={`Pagamentos confirmados em ${mesReferencia}`}
            variant="success"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <StatCard
            title="Empréstimos do Mês"
            value={formatCurrency(stats.totalEmprestimosMes)}
            description={`Aprovados/quitados em ${mesReferencia}`}
            variant="info"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <Card variant="elevated" className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Pagamentos Pendentes</CardTitle>
              <CardDescription>Aguardando confirmação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.pagamentosPendentes}
                </p>
                <Link href="/admin/pagamentos">
                  <Button size="sm" className="gradient-primary text-white border-0 hover:opacity-90">
                    Ver
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated" className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Empréstimos Pendentes</CardTitle>
              <CardDescription>Aguardando aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.emprestimosPendentes}
                </p>
                <Link href="/admin/emprestimos">
                  <Button size="sm" className="gradient-primary text-white border-0 hover:opacity-90">
                    Ver
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas Anuais */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Estatísticas do Ano {stats.referenciaAno}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <StatCard
            title="Arrecadação Anual"
            value={formatCurrency(stats.totalArrecadadoAno)}
            description="Total arrecadado no ano de referência"
            variant="success"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />

          {stats.sorteioMes && (
            <Card
              variant="elevated"
              className="relative overflow-hidden bg-white dark:bg-gray-900/80 border border-gray-200/70 dark:border-slate-700/80"
            >
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-white">Sorteio do Mês</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {new Date(
                    stats.sorteioMes.ano,
                    stats.sorteioMes.mes - 1
                  ).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Prêmio: {formatCurrency(stats.sorteioMes.premio_valor)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Status: {stats.sorteioMes.status === 'aberto' ? 'Aberto' : 'Realizado'}
                  </p>
                  <Link href="/admin/sorteios">
                    <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 font-semibold mt-2 border border-gray-200 dark:border-gray-300">
                      Gerenciar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Links Rápidos */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Link href="/admin/usuarios">
            <Card variant="elevated" className="hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-base group-hover:text-primary transition-colors">Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gerenciar usuários</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/pagamentos">
            <Card variant="elevated" className="hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-base group-hover:text-primary transition-colors">Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.pagamentosPendentes} pendentes
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/emprestimos">
            <Card variant="elevated" className="hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-base group-hover:text-primary transition-colors">Empréstimos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.emprestimosPendentes} pendentes
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/sorteios">
            <Card variant="elevated" className="hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-base group-hover:text-primary transition-colors">Sorteios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gerenciar sorteios</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/configuracoes">
            <Card variant="elevated" className="hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-base group-hover:text-primary transition-colors">Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ajustar parâmetros</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

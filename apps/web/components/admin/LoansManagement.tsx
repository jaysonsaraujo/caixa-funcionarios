'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Loan {
  id: string
  user_id: string
  valor_solicitado: number
  valor_total_devolver: number
  data_solicitacao: string
  data_vencimento: string
  status: string
  tipo: string
  users: {
    full_name: string | null
    email: string
  }
}

export function LoansManagement() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadLoans = async () => {
      const { data } = await supabase
        .from('loans')
        .select(
          `
          *,
          users(full_name, email)
        `
        )
        .eq('status', 'pendente')
        .order('data_solicitacao', { ascending: false })

      if (data) {
        setLoans(data as any)
      }
      setLoading(false)
    }

    loadLoans()
  }, [supabase])

  const approveLoan = async (loanId: string) => {
    const { error } = await supabase
      .from('loans')
      .update({ status: 'aprovado' })
      .eq('id', loanId)

    if (!error) {
      setLoans((prev) => prev.filter((l) => l.id !== loanId))
    }
  }

  const rejectLoan = async (loanId: string) => {
    const { error } = await supabase
      .from('loans')
      .update({ status: 'quitado' }) // Marcar como quitado/rejeitado
      .eq('id', loanId)

    if (!error) {
      setLoans((prev) => prev.filter((l) => l.id !== loanId))
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600 dark:text-gray-400">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {loans.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
          Total de empréstimos pendentes: {loans.length}
        </div>
      )}
      {loans.map((loan) => (
        <div
          key={loan.id}
          className="p-5 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full gradient-info flex items-center justify-center text-white font-bold text-sm">
                  {(loan.users?.full_name || loan.users?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {loan.users?.full_name || loan.users?.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{loan.users?.email}</p>
                </div>
              </div>
              <div className="ml-12 space-y-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(loan.valor_solicitado)}
                  </p>
                  <span className="text-gray-400 dark:text-gray-500">→</span>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(loan.valor_total_devolver)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Solicitado: {formatDate(loan.data_solicitacao)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Vencimento: {formatDate(loan.data_vencimento)} | Tipo: {loan.tipo === 'cotista' ? 'Cotista' : 'Não Cotista'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => rejectLoan(loan.id)}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                Rejeitar
              </Button>
              <Button 
                size="sm" 
                onClick={() => approveLoan(loan.id)}
                className="gradient-success text-white border-0 hover:opacity-90"
              >
                Aprovar
              </Button>
            </div>
          </div>
        </div>
      ))}
      {loans.length === 0 && !loading && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">Nenhum empréstimo pendente</p>
      )}
    </div>
  )
}

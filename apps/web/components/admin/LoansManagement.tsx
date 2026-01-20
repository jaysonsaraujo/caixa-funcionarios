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
        .limit(10)

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
    return <div className="text-sm text-gray-600">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {loans.map((loan) => (
        <div
          key={loan.id}
          className="p-4 border rounded-lg space-y-2"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{loan.users?.full_name || loan.users?.email}</p>
              <p className="text-sm text-gray-600">
                Solicitado: {formatDate(loan.data_solicitacao)}
              </p>
              <p className="text-sm font-medium">
                Valor: {formatCurrency(loan.valor_solicitado)} →{' '}
                {formatCurrency(loan.valor_total_devolver)}
              </p>
              <p className="text-xs text-gray-500">
                Vencimento: {formatDate(loan.data_vencimento)} | Tipo: {loan.tipo}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => rejectLoan(loan.id)}>
                Rejeitar
              </Button>
              <Button size="sm" onClick={() => approveLoan(loan.id)}>
                Aprovar
              </Button>
            </div>
          </div>
        </div>
      ))}
      {loans.length === 0 && (
        <p className="text-sm text-gray-600">Nenhum empréstimo pendente</p>
      )}
    </div>
  )
}

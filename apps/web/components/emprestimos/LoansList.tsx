'use client'

import { formatCurrency, formatDate } from '@/lib/utils'

interface Loan {
  id: string
  valor_solicitado: number
  valor_total_devolver: number
  data_solicitacao: string
  data_vencimento: string
  juro_aplicado: number
  status: 'pendente' | 'aprovado' | 'quitado' | 'atrasado'
  tipo: 'cotista' | 'nao_cotista'
}

interface LoansListProps {
  loans: Loan[]
}

export function LoansList({ loans }: LoansListProps) {
  const getStatusBadge = (status: Loan['status']) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800',
      aprovado: 'bg-blue-100 text-blue-800',
      quitado: 'bg-green-100 text-green-800',
      atrasado: 'bg-red-100 text-red-800',
    }
    const labels = {
      pendente: 'Pendente',
      aprovado: 'Aprovado',
      quitado: 'Quitado',
      atrasado: 'Atrasado',
    }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {loans.map((loan) => (
        <div
          key={loan.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">
                  Solicitado em: {formatDate(loan.data_solicitacao)}
                </p>
                <p className="text-sm text-gray-600">
                  Vencimento: {formatDate(loan.data_vencimento)}
                </p>
                <p className="text-sm text-gray-600">Tipo: {loan.tipo === 'cotista' ? 'Cotista' : 'Não Cotista'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor solicitado:</p>
                <p className="font-bold text-lg">{formatCurrency(loan.valor_solicitado)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total a devolver:</p>
                <p className="font-bold text-lg">{formatCurrency(loan.valor_total_devolver)}</p>
                <p className="text-xs text-red-600">Juro: {loan.juro_aplicado}%</p>
              </div>
              <div>{getStatusBadge(loan.status)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

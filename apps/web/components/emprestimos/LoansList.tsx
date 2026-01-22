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
          className="flex items-center justify-between p-5 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
        >
          <div className="flex-1">
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-lg gradient-info flex items-center justify-center text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Solicitado em: {formatDate(loan.data_solicitacao)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vencimento: {formatDate(loan.data_vencimento)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tipo: {loan.tipo === 'cotista' ? 'Cotista' : 'Não Cotista'} | Juro: {loan.juro_aplicado}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor solicitado:</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(loan.valor_solicitado)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total a devolver:</p>
                <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(loan.valor_total_devolver)}</p>
              </div>
              <div>{getStatusBadge(loan.status)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

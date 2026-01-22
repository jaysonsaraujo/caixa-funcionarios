'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/shared/Button'
import { PaymentForm } from './PaymentForm'

interface Payment {
  id: string
  mes_referencia: number
  ano_referencia: number
  valor_pago: number
  data_vencimento: string
  data_pagamento: string | null
  juro_aplicado: number
  status: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
  forma_pagamento: 'PIX' | 'dinheiro'
  comprovante_url: string | null
}

interface Quota {
  id: string
  num_cotas: number
  valor_por_cota: number
}

interface QuotaPaymentsListProps {
  payments: Payment[]
  quota: Quota
}

export function QuotaPaymentsList({ payments, quota }: QuotaPaymentsListProps) {
  const getStatusBadge = (status: Payment['status']) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800',
      pago: 'bg-green-100 text-green-800',
      atrasado: 'bg-red-100 text-red-800',
      aguardando_confirmacao: 'bg-blue-100 text-blue-800',
    }
    const labels = {
      pendente: 'Pendente',
      pago: 'Pago',
      atrasado: 'Atrasado',
      aguardando_confirmacao: 'Aguardando Confirmação',
    }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ]
    return months[month - 1]
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between p-5 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
        >
          <div className="flex-1">
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center text-white font-bold">
                {payment.mes_referencia}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {getMonthName(payment.mes_referencia)}/{payment.ano_referencia}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vencimento: {formatDate(payment.data_vencimento)}
                </p>
                {payment.data_pagamento && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Pagamento: {formatDate(payment.data_pagamento)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-gray-900 dark:text-white">{formatCurrency(payment.valor_pago)}</p>
                {payment.juro_aplicado > 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Juro: {formatCurrency(payment.juro_aplicado)}
                  </p>
                )}
              </div>
              <div>{getStatusBadge(payment.status)}</div>
            </div>
          </div>
          <div className="ml-4 flex flex-col gap-2">
            {payment.status === 'pendente' && (
              <PaymentForm paymentId={payment.id} valor={payment.valor_pago} />
            )}
            {payment.status === 'aguardando_confirmacao' && (
              <p className="text-sm text-blue-600 font-medium">Aguardando confirmação</p>
            )}
            {payment.comprovante_url && (
              <a
                href={payment.comprovante_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver comprovante
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

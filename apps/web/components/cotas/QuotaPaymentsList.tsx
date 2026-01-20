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
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">
                  {getMonthName(payment.mes_referencia)}/{payment.ano_referencia}
                </p>
                <p className="text-sm text-gray-600">
                  Vencimento: {formatDate(payment.data_vencimento)}
                </p>
                {payment.data_pagamento && (
                  <p className="text-sm text-gray-600">
                    Pagamento: {formatDate(payment.data_pagamento)}
                  </p>
                )}
              </div>
              <div>
                <p className="font-bold text-lg">{formatCurrency(payment.valor_pago)}</p>
                {payment.juro_aplicado > 0 && (
                  <p className="text-sm text-red-600">
                    Juro: {formatCurrency(payment.juro_aplicado)}
                  </p>
                )}
              </div>
              <div>{getStatusBadge(payment.status)}</div>
            </div>
          </div>
          <div className="ml-4">
            {payment.status === 'pendente' && (
              <PaymentForm paymentId={payment.id} valor={payment.valor_pago} />
            )}
            {payment.status === 'aguardando_confirmacao' && (
              <p className="text-sm text-blue-600">Aguardando confirmação do administrador</p>
            )}
            {payment.comprovante_url && (
              <a
                href={payment.comprovante_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Ver comprovante
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

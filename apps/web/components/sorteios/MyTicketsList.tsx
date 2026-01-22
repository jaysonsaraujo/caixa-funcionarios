'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { RafflePaymentForm } from '@/components/sorteios/RafflePaymentForm'

interface Ticket {
  id: string
  numero_escolhido: number
  valor_pago: number
  data_reserva: string
  data_vencimento_reserva: string
  status: 'reservado' | 'confirmado' | 'liberado'
  pagamento_status?: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
  comprovante_url?: string | null
  forma_pagamento?: 'PIX' | 'dinheiro' | null
}

interface MyTicketsListProps {
  tickets: Ticket[]
}

export function MyTicketsList({ tickets }: MyTicketsListProps) {
  const getStatusBadge = (status: Ticket['status']) => {
    const styles = {
      reservado: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-green-100 text-green-800',
      liberado: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      reservado: 'Reservado',
      confirmado: 'Confirmado',
      liberado: 'Liberado',
    }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getPaymentBadge = (status?: Ticket['pagamento_status']) => {
    if (!status) return null
    const styles = {
      pendente: 'bg-gray-100 text-gray-800',
      aguardando_confirmacao: 'bg-blue-100 text-blue-800',
      pago: 'bg-green-100 text-green-800',
      atrasado: 'bg-red-100 text-red-800',
    }
    const labels = {
      pendente: 'Pagamento pendente',
      aguardando_confirmacao: 'Pagamento em análise',
      pago: 'Pagamento confirmado',
      atrasado: 'Pagamento atrasado',
    }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const isExpired = (vencimento: string) => {
    return new Date(vencimento) < new Date()
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const expired = ticket.status === 'reservado' && isExpired(ticket.data_vencimento_reserva)
        const canSubmitPayment =
          ticket.status === 'reservado' &&
          ticket.pagamento_status !== 'aguardando_confirmacao' &&
          ticket.pagamento_status !== 'pago' &&
          !expired

        return (
          <div
            key={ticket.id}
            className="flex flex-col gap-4 p-5 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
          >
          <div className="flex items-center gap-6 flex-1">
            <div className={`h-14 w-14 rounded-xl flex items-center justify-center font-bold text-xl ${
              ticket.status === 'confirmado' 
                ? 'gradient-success text-white' 
                : ticket.status === 'reservado' && expired
                ? 'bg-red-500 dark:bg-red-600 text-white'
                : 'gradient-primary text-white'
            }`}>
              {ticket.numero_escolhido}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Número {ticket.numero_escolhido}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reservado em: {formatDate(ticket.data_reserva)}
              </p>
              {ticket.status === 'reservado' && (
                <p
                  className={`text-sm font-medium mt-1 ${
                    expired
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Vence em: {formatDate(ticket.data_vencimento_reserva)}
                  {expired && ' (EXPIRADO)'}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(ticket.valor_pago)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(ticket.status)}
              {getPaymentBadge(ticket.pagamento_status)}
            </div>
          </div>
          {ticket.status === 'reservado' && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30 p-4">
              {ticket.pagamento_status === 'aguardando_confirmacao' ? (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Pagamento enviado. Aguardando confirmação do administrador.
                </p>
              ) : ticket.pagamento_status === 'pago' ? (
                <p className="text-xs text-green-700 dark:text-green-300">
                  Pagamento confirmado pelo administrador.
                </p>
              ) : expired ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Reserva expirada. O número será liberado caso não haja confirmação.
                </p>
              ) : (
                <RafflePaymentForm
                  ticketId={ticket.id}
                  valor={ticket.valor_pago}
                  disabled={!canSubmitPayment}
                />
              )}
            </div>
          )}
          </div>
        )
      })}
    </div>
  )
}

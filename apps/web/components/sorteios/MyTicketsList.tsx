'use client'

import { formatCurrency, formatDate } from '@/lib/utils'

interface Ticket {
  id: string
  numero_escolhido: number
  valor_pago: number
  data_reserva: string
  data_vencimento_reserva: string
  status: 'reservado' | 'confirmado' | 'liberado'
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
      reservado: 'Reservado - Aguardando pagamento',
      confirmado: 'Confirmado',
      liberado: 'Liberado',
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
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
              {ticket.numero_escolhido}
            </div>
            <div>
              <p className="font-medium">Número {ticket.numero_escolhido}</p>
              <p className="text-sm text-gray-600">
                Reservado em: {formatDate(ticket.data_reserva)}
              </p>
              {ticket.status === 'reservado' && (
                <p
                  className={`text-sm ${
                    isExpired(ticket.data_vencimento_reserva)
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  Vence em: {formatDate(ticket.data_vencimento_reserva)}
                  {isExpired(ticket.data_vencimento_reserva) && ' (EXPIRADO)'}
                </p>
              )}
            </div>
            <div>
              <p className="font-bold">{formatCurrency(ticket.valor_pago)}</p>
            </div>
            <div>{getStatusBadge(ticket.status)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

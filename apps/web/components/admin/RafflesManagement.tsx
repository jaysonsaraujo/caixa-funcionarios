'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Label } from '@/components/shared/Label'
import { formatCurrency, formatDate } from '@/lib/utils'

interface TicketWithUser {
  id: string
  numero_escolhido: number
  valor_pago: number
  data_reserva: string
  data_vencimento_reserva: string
  status: 'reservado' | 'confirmado' | 'liberado'
  user_id: string
  user: {
    full_name: string | null
    email: string
  }
}

export function RafflesManagement() {
  const [raffle, setRaffle] = useState<any>(null)
  const [resultadoLoteria, setResultadoLoteria] = useState('')
  const [tickets, setTickets] = useState<TicketWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTickets, setLoadingTickets] = useState(true)
  const supabase = createClient()

  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()

  const loadTickets = useCallback(async (raffleId: string) => {
    setLoadingTickets(true)
    
    // Buscar tickets
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('raffle_tickets')
      .select('*')
      .eq('raffle_id', raffleId)
      .order('numero_escolhido', { ascending: true })

    if (ticketsError) {
      console.error('Erro ao buscar tickets:', ticketsError)
      setLoadingTickets(false)
      return
    }

    if (!ticketsData || ticketsData.length === 0) {
      setTickets([])
      setLoadingTickets(false)
      return
    }

    // Buscar informações dos usuários
    const userIds = [...new Set(ticketsData.map((t: any) => t.user_id))]
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
    }

    // Combinar dados
    const usersMap = new Map(
      (usersData || []).map((user: any) => [user.id, { full_name: user.full_name, email: user.email }])
    )

    const ticketsWithUser = ticketsData.map((ticket: any) => ({
      ...ticket,
      user: usersMap.get(ticket.user_id) || { full_name: null, email: 'N/A' },
    }))

    setTickets(ticketsWithUser)
    setLoadingTickets(false)
  }, [supabase])

  useEffect(() => {
    const loadRaffle = async () => {
      const { data } = await supabase
        .from('monthly_raffles')
        .select('*')
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .single()

      if (data) {
        setRaffle(data)
        setResultadoLoteria(data.resultado_loteria || '')
        loadTickets(data.id)
      }
      setLoading(false)
    }

    loadRaffle()
  }, [supabase, mesAtual, anoAtual, loadTickets])

  const updateRaffleResult = async () => {
    if (!raffle || !resultadoLoteria) return

    // Calcular número sorteado (últimos 2 dígitos do resultado)
    const ultimosDigitos = resultadoLoteria.slice(-2)
    const numeroSorteado = parseInt(ultimosDigitos) || 0

    if (numeroSorteado < 1 || numeroSorteado > 100) {
      alert('O número sorteado deve estar entre 1 e 100')
      return
    }

    const { error } = await supabase
      .from('monthly_raffles')
      .update({
        resultado_loteria: resultadoLoteria,
        numero_sorteado: numeroSorteado,
        status: 'sorteado',
        data_sorteio: new Date().toISOString().split('T')[0],
      })
      .eq('id', raffle.id)

    if (!error) {
      setRaffle({
        ...raffle,
        resultado_loteria: resultadoLoteria,
        numero_sorteado: numeroSorteado,
        status: 'sorteado',
      })
      alert('Sorteio realizado com sucesso!')
      // Recarregar tickets após realizar sorteio
      loadTickets(raffle.id)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Carregando...</div>
  }

  if (!raffle) {
    return <p className="text-sm text-gray-600">Nenhum sorteio encontrado para este mês</p>
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="font-medium">
          Sorteio de {new Date(raffle.ano, raffle.mes - 1).toLocaleString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <p className="text-sm text-gray-600">Prêmio: {formatCurrency(raffle.premio_valor)}</p>
        <p className="text-sm text-gray-600">Status: {raffle.status}</p>
        {raffle.numero_sorteado && (
          <p className="text-lg font-bold mt-2">Número sorteado: {raffle.numero_sorteado}</p>
        )}
      </div>

      {raffle.status === 'aberto' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="resultadoLoteria">Resultado da Loteria Federal</Label>
            <Input
              id="resultadoLoteria"
              type="text"
              value={resultadoLoteria}
              onChange={(e) => setResultadoLoteria(e.target.value)}
              placeholder="Digite o resultado completo"
            />
            <p className="text-xs text-gray-500 mt-1">
              Os últimos 2 dígitos serão usados como número sorteado (1-100)
            </p>
          </div>
          <Button onClick={updateRaffleResult} disabled={!resultadoLoteria}>
            Realizar Sorteio
          </Button>
        </div>
      )}

      {/* Histórico de Escolhas dos Usuários */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Histórico de Escolhas dos Usuários</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => raffle && loadTickets(raffle.id)}
            disabled={loadingTickets}
          >
            {loadingTickets ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>

        {loadingTickets ? (
          <div className="text-sm text-gray-600">Carregando histórico...</div>
        ) : tickets.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
            Nenhuma escolha registrada ainda para este sorteio.
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Agrupar tickets por usuário
              const groupedByUser = tickets.reduce((acc, ticket) => {
                const userId = ticket.user_id
                if (!acc[userId]) {
                  acc[userId] = {
                    user: ticket.user,
                    tickets: [],
                  }
                }
                acc[userId].tickets.push(ticket)
                return acc
              }, {} as Record<string, { user: TicketWithUser['user']; tickets: TicketWithUser[] }>)

              // Ordenar tickets dentro de cada grupo por número
              Object.values(groupedByUser).forEach((group) => {
                group.tickets.sort((a, b) => a.numero_escolhido - b.numero_escolhido)
              })

              return Object.entries(groupedByUser).map(([userId, group]) => {
                const userTickets = group.tickets
                const totalConfirmado = userTickets
                  .filter((t) => t.status === 'confirmado')
                  .reduce((sum, t) => sum + Number(t.valor_pago), 0)
                const totalReservado = userTickets
                  .filter((t) => t.status === 'reservado')
                  .reduce((sum, t) => sum + Number(t.valor_pago), 0)

                return (
                  <div key={userId} className="border rounded-lg overflow-hidden">
                    {/* Cabeçalho do Usuário */}
                    <div className="bg-blue-50 px-6 py-4 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {group.user.full_name || 'Sem nome'}
                          </h4>
                          <p className="text-sm text-gray-600">{group.user.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            <strong>Total de números:</strong> {userTickets.length}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Confirmados:</strong>{' '}
                            {userTickets.filter((t) => t.status === 'confirmado').length} |{' '}
                            <strong>Reservados:</strong>{' '}
                            {userTickets.filter((t) => t.status === 'reservado').length}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            Valor Total: {formatCurrency(totalConfirmado + totalReservado)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Números Escolhidos */}
                    <div className="p-4">
                      <div className="flex flex-wrap gap-3">
                        {userTickets.map((ticket) => {
                          const isExpired =
                            ticket.status === 'reservado' &&
                            new Date(ticket.data_vencimento_reserva) < new Date()
                          const isWinner =
                            raffle.numero_sorteado &&
                            ticket.numero_escolhido === raffle.numero_sorteado &&
                            ticket.status === 'confirmado'

                          return (
                            <div
                              key={ticket.id}
                              className={`relative flex flex-col items-center p-3 rounded-lg border-2 ${
                                isWinner
                                  ? 'bg-yellow-50 border-yellow-400'
                                  : isExpired
                                    ? 'bg-red-50 border-red-300'
                                    : ticket.status === 'confirmado'
                                      ? 'bg-green-50 border-green-300'
                                      : 'bg-yellow-50 border-yellow-300'
                              }`}
                            >
                              {isWinner && (
                                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  🏆
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center justify-center h-12 w-12 rounded-full font-bold text-lg ${
                                  isWinner
                                    ? 'bg-yellow-500 text-white'
                                    : ticket.status === 'confirmado'
                                      ? 'bg-green-500 text-white'
                                      : ticket.status === 'reservado'
                                        ? isExpired
                                          ? 'bg-red-500 text-white'
                                          : 'bg-yellow-400 text-white'
                                        : 'bg-gray-400 text-white'
                                }`}
                              >
                                {ticket.numero_escolhido}
                              </span>
                              <div className="mt-2 text-center">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    ticket.status === 'confirmado'
                                      ? 'bg-green-100 text-green-800'
                                      : ticket.status === 'reservado'
                                        ? isExpired
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {ticket.status === 'confirmado'
                                    ? 'Confirmado'
                                    : ticket.status === 'reservado'
                                      ? isExpired
                                        ? 'Expirado'
                                        : 'Reservado'
                                      : 'Liberado'}
                                </span>
                                <p className="text-xs text-gray-600 mt-1">
                                  {formatCurrency(ticket.valor_pago)}
                                </p>
                                {ticket.status === 'reservado' && (
                                  <p
                                    className={`text-xs mt-1 ${
                                      isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'
                                    }`}
                                  >
                                    Vence: {formatDate(ticket.data_vencimento_reserva)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}

        {tickets.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Total de escolhas:</strong> {tickets.length} número(s) |{' '}
              <strong>Total arrecadado:</strong>{' '}
              {formatCurrency(
                tickets
                  .filter((t) => t.status === 'confirmado')
                  .reduce((sum, t) => sum + Number(t.valor_pago), 0)
              )}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Confirmados: {tickets.filter((t) => t.status === 'confirmado').length} | Reservados:{' '}
              {tickets.filter((t) => t.status === 'reservado').length} | Liberados:{' '}
              {tickets.filter((t) => t.status === 'liberado').length}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

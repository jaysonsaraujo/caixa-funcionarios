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
  pagamento_status?: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
  forma_pagamento?: 'PIX' | 'dinheiro' | null
  comprovante_url?: string | null
  data_pagamento?: string | null
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

  const confirmTicketsPayment = async (ticketsToConfirm: TicketWithUser[]) => {
    if (!raffle || ticketsToConfirm.length === 0) return

    const idsWithMethod = ticketsToConfirm.filter((t) => t.forma_pagamento).map((t) => t.id)
    const idsWithoutMethod = ticketsToConfirm
      .filter((t) => !t.forma_pagamento)
      .map((t) => t.id)

    const baseUpdate = {
      pagamento_status: 'pago',
      status: 'confirmado',
      data_pagamento: new Date().toISOString().split('T')[0],
    }

    const { error: errorWithMethod } =
      idsWithMethod.length > 0
        ? await supabase.from('raffle_tickets').update(baseUpdate).in('id', idsWithMethod)
        : { error: null }

    const { error: errorWithoutMethod } =
      idsWithoutMethod.length > 0
        ? await supabase
            .from('raffle_tickets')
            .update({ ...baseUpdate, forma_pagamento: 'dinheiro' })
            .in('id', idsWithoutMethod)
        : { error: null }

    if (!errorWithMethod && !errorWithoutMethod) {
      loadTickets(raffle.id)
    }
  }

  const rejectTicketsPayment = async (ticketsToReject: TicketWithUser[]) => {
    if (!raffle || ticketsToReject.length === 0) return

    const ids = ticketsToReject.map((t) => t.id)
    const { error } = await supabase
      .from('raffle_tickets')
      .update({
        pagamento_status: 'pendente',
        forma_pagamento: null,
        comprovante_url: null,
        data_pagamento: null,
      })
      .in('id', ids)

    if (!error) {
      loadTickets(raffle.id)
    }
  }

  const getPaymentBadge = (status?: TicketWithUser['pagamento_status']) => {
    if (!status) return null
    const styles = {
      pendente: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      aguardando_confirmacao: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
      pago: 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200',
      atrasado: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200',
    }
    const labels = {
      pendente: 'Pagamento pendente',
      aguardando_confirmacao: 'Pagamento em análise',
      pago: 'Pagamento confirmado',
      atrasado: 'Pagamento atrasado',
    }
    return (
      <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

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
    return <div className="text-sm text-gray-600 dark:text-gray-400">Carregando...</div>
  }

  if (!raffle) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">Nenhum sorteio encontrado para este mês</p>
  }

  const numberStatusMap = new Map<number, 'confirmado' | 'reservado'>()
  tickets.forEach((ticket) => {
    if (ticket.status === 'confirmado') {
      numberStatusMap.set(ticket.numero_escolhido, 'confirmado')
    } else if (ticket.status === 'reservado' && !numberStatusMap.has(ticket.numero_escolhido)) {
      numberStatusMap.set(ticket.numero_escolhido, 'reservado')
    }
  })

  const confirmedCount = tickets.filter((t) => t.status === 'confirmado').length
  const reservedCount = tickets.filter((t) => t.status === 'reservado').length
  const chosenCount = confirmedCount + reservedCount
  const availableCount = 100 - chosenCount

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent dark:from-primary/20 dark:via-accent/10 rounded-xl border-2 border-primary/20 dark:border-primary/30">
        <p className="font-semibold text-gray-900 dark:text-white">
          Sorteio de {new Date(raffle.ano, raffle.mes - 1).toLocaleString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Prêmio: {formatCurrency(raffle.premio_valor)}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">Status: {raffle.status === 'aberto' ? 'Aberto' : 'Realizado'}</p>
        {raffle.numero_sorteado && (
          <p className="text-lg font-bold mt-2 text-gray-900 dark:text-white">Número sorteado: {raffle.numero_sorteado}</p>
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Os últimos 2 dígitos serão usados como número sorteado (1-100)
            </p>
          </div>
          <Button onClick={updateRaffleResult} disabled={!resultadoLoteria}>
            Realizar Sorteio
          </Button>
        </div>
      )}

      <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Visão geral dos números</h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Confirmados: {confirmedCount} | Reservados: {reservedCount} | Disponíveis: {availableCount}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-10 gap-1 sm:gap-2">
          {Array.from({ length: 100 }, (_, i) => {
            const num = i + 1
            const status = numberStatusMap.get(num)
            return (
              <div
                key={num}
                className={`h-6 w-6 sm:h-7 sm:w-7 rounded-md text-[10px] sm:text-[11px] font-semibold flex items-center justify-center ${
                  status === 'confirmado'
                    ? 'bg-green-500 text-white'
                    : status === 'reservado'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800'
                }`}
              >
                {num}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-green-500" />
            Confirmados
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-yellow-500" />
            Reservados
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-blue-200 dark:bg-blue-800/60 border border-blue-300 dark:border-blue-700" />
            Disponíveis
          </span>
        </div>
      </div>

      {/* Histórico de Escolhas dos Usuários */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Escolhas dos Usuários</h3>
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
          <div className="text-sm text-gray-600 dark:text-gray-400">Carregando histórico...</div>
        ) : tickets.length === 0 ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            Nenhuma escolha registrada ainda para este sorteio.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.some((t) => t.pagamento_status === 'aguardando_confirmacao') && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-900 dark:text-blue-200">
                Existem pagamentos aguardando confirmação. Revise e confirme para liberar os números.
              </div>
            )}
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
                const confirmableTickets = userTickets.filter(
                  (t) =>
                    t.status === 'reservado' &&
                    (t.pagamento_status === 'pendente' ||
                      t.pagamento_status === 'aguardando_confirmacao')
                )
                const rejectableTickets = userTickets.filter(
                  (t) => t.pagamento_status === 'aguardando_confirmacao'
                )
                const pendingTickets = userTickets.filter((t) => t.pagamento_status === 'pendente')
                const totalConfirmado = userTickets
                  .filter((t) => t.status === 'confirmado')
                  .reduce((sum, t) => sum + Number(t.valor_pago), 0)
                const totalReservado = userTickets
                  .filter((t) => t.status === 'reservado')
                  .reduce((sum, t) => sum + Number(t.valor_pago), 0)

                return (
                  <div key={userId} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                    {/* Cabeçalho do Usuário */}
                    <div className="bg-[hsl(var(--card))] px-6 py-4 border-b border-blue-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {group.user.full_name || 'Sem nome'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-100">{group.user.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-700 dark:text-gray-100">
                            <strong>Total de números:</strong> {userTickets.length}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-100">
                            <strong>Confirmados:</strong>{' '}
                            {userTickets.filter((t) => t.status === 'confirmado').length} |{' '}
                            <strong>Reservados:</strong>{' '}
                            {userTickets.filter((t) => t.status === 'reservado').length}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            Valor Total: {formatCurrency(totalConfirmado + totalReservado)}
                          </p>
                          {confirmableTickets.length > 0 && (
                            <div className="mt-3 flex flex-col items-end gap-2">
                              {rejectableTickets.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectTicketsPayment(rejectableTickets)}
                                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                >
                                  Rejeitar envios ({rejectableTickets.length})
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => confirmTicketsPayment(confirmableTickets)}
                                className="gradient-success text-white border-0 hover:opacity-90"
                              >
                                Confirmar todos ({confirmableTickets.length})
                              </Button>
                              {pendingTickets.length > 0 && (
                                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                  Sem comprovante. Confirme apenas se o pagamento foi recebido.
                                </p>
                              )}
                            </div>
                          )}
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
                          const awaitingConfirmation =
                            ticket.pagamento_status === 'aguardando_confirmacao'
                          const pendingPayment = ticket.pagamento_status === 'pendente'

                          return (
                            <div
                              key={ticket.id}
                              className={`relative flex flex-col items-center p-3 rounded-lg border-2 ${
                                isWinner
                                  ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600'
                                  : isExpired
                                    ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600'
                                    : ticket.status === 'confirmado'
                                      ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600'
                                      : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600'
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
                                      ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                      : ticket.status === 'reservado'
                                        ? isExpired
                                          ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                                          : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
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
                                {getPaymentBadge(ticket.pagamento_status)}
                                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                                  {formatCurrency(ticket.valor_pago)}
                                </p>
                                {ticket.status === 'reservado' && (
                                  <p
                                    className={`text-xs mt-1 ${
                                      isExpired ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    Vence: {formatDate(ticket.data_vencimento_reserva)}
                                  </p>
                                )}
                                {ticket.forma_pagamento && (
                                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                                    Forma: {ticket.forma_pagamento}
                                  </p>
                                )}
                                {ticket.comprovante_url && (
                                  <a
                                    href={ticket.comprovante_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-flex items-center gap-1"
                                  >
                                    Ver comprovante
                                  </a>
                                )}
                                {awaitingConfirmation && (
                                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1">
                                    Envio aguardando confirmação do admin.
                                  </p>
                                )}
                                {pendingPayment && (
                                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                                    Pagamento pendente sem comprovante.
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
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
              <strong>Total de escolhas:</strong> {tickets.length} número(s) |{' '}
              <strong>Total arrecadado:</strong>{' '}
              {formatCurrency(
                tickets
                  .filter((t) => t.status === 'confirmado')
                  .reduce((sum, t) => sum + Number(t.valor_pago), 0)
              )}
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
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

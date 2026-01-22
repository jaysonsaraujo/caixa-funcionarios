'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Ticket {
  numero_escolhido: number
  status: string
  user_id: string
}

interface RaffleNumbersGridProps {
  raffleId: string
  valorBilhete: number
  takenNumbers: Ticket[]
  currentUserId: string
}

export function RaffleNumbersGrid({
  raffleId,
  valorBilhete,
  takenNumbers,
  currentUserId,
}: RaffleNumbersGridProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const takenNumbersSet = new Set(takenNumbers.map((t) => t.numero_escolhido))
  const myTickets = takenNumbers.filter((t) => t.user_id === currentUserId)
  const myNumbers = myTickets.map((t) => t.numero_escolhido)
  const myNumberStatus = new Map(myTickets.map((t) => [t.numero_escolhido, t.status]))

  const isNumberTaken = (num: number) => takenNumbersSet.has(num)
  const isMyNumber = (num: number) => myNumbers.includes(num)

  const toggleNumber = (num: number) => {
    if (isNumberTaken(num)) {
      return // Não pode movimentar número já reservado/confirmado
    }

    setSelectedNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num)
      } else {
        return [...prev, num]
      }
    })
  }

  const handleSubmit = async () => {
    if (selectedNumbers.length === 0) {
      setError('Selecione pelo menos um número')
      return
    }

    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Usuário não autenticado')
      setLoading(false)
      return
    }

    // Criar reservas (3 dias para pagamento)
    const hoje = new Date()
    const dataVencimento = new Date(hoje)
    dataVencimento.setDate(dataVencimento.getDate() + 3)

    const tickets = selectedNumbers.map((numero) => ({
      raffle_id: raffleId,
      user_id: user.id,
      numero_escolhido: numero,
      valor_pago: valorBilhete,
      data_vencimento_reserva: dataVencimento.toISOString(),
      status: 'reservado',
    }))

    const { error: insertError } = await supabase.from('raffle_tickets').insert(tickets)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSelectedNumbers([])
    router.refresh()
  }

  const totalValue = selectedNumbers.length * valorBilhete

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">{error}</div>
      )}

      <div className="grid grid-cols-10 gap-2 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
          const isSelected = selectedNumbers.includes(num)
          const taken = isNumberTaken(num)
          const isMine = isMyNumber(num)
          const myStatus = myNumberStatus.get(num)

          return (
            <button
              key={num}
              type="button"
              onClick={() => toggleNumber(num)}
              disabled={taken}
              className={cn(
                'h-12 w-12 rounded-xl text-sm font-bold transition-all duration-200',
                isSelected && 'gradient-primary text-white shadow-lg scale-110',
                !isSelected && !taken && 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 text-gray-700 dark:text-gray-200',
                taken && !isMine && 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60',
                isMine && myStatus === 'confirmado' && 'gradient-success text-white shadow-lg',
                isMine && myStatus === 'reservado' && 'bg-yellow-500 text-white shadow-lg'
              )}
            >
              {num}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent dark:from-primary/20 dark:via-accent/10 rounded-xl border-2 border-primary/20 dark:border-primary/30">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Números selecionados: <span className="font-bold text-primary dark:text-primary">{selectedNumbers.length}</span>
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalValue)}</p>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || selectedNumbers.length === 0}
          className="gradient-primary text-white border-0 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Reservando...' : 'Reservar Números'}
        </Button>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">ℹ️ Informações importantes:</p>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <p>• Números verdes são seus números confirmados</p>
          <p>• Números amarelos são suas reservas aguardando pagamento</p>
          <p>• Números cinza estão ocupados por outros usuários</p>
          <p>• Números já reservados/confirmados não podem ser alterados</p>
          <p>• Você tem 3 dias para realizar o pagamento após reservar</p>
          <p>• Números não pagos serão liberados automaticamente</p>
        </div>
      </div>
    </div>
  )
}

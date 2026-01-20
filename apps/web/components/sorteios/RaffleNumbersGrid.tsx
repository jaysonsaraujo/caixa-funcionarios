'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { formatCurrency, addDaysToString } from '@/lib/utils'
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
  const myNumbers = takenNumbers
    .filter((t) => t.user_id === currentUserId)
    .map((t) => t.numero_escolhido)

  const isNumberTaken = (num: number) => takenNumbersSet.has(num)
  const isMyNumber = (num: number) => myNumbers.includes(num)

  const toggleNumber = (num: number) => {
    if (isNumberTaken(num) && !isMyNumber(num)) {
      return // Não pode selecionar número já escolhido por outro
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
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
      )}

      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
          const isSelected = selectedNumbers.includes(num)
          const taken = isNumberTaken(num)
          const isMine = isMyNumber(num)

          return (
            <button
              key={num}
              type="button"
              onClick={() => toggleNumber(num)}
              disabled={taken && !isMine}
              className={cn(
                'h-10 w-10 rounded-md text-sm font-medium transition-colors',
                isSelected && 'bg-blue-500 text-white',
                !isSelected && !taken && 'bg-gray-100 hover:bg-gray-200',
                taken && !isMine && 'bg-gray-300 text-gray-500 cursor-not-allowed',
                isMine && 'bg-green-500 text-white'
              )}
            >
              {num}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Números selecionados: {selectedNumbers.length}
          </p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
        </div>
        <Button onClick={handleSubmit} disabled={loading || selectedNumbers.length === 0}>
          {loading ? 'Reservando...' : 'Reservar Números'}
        </Button>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <p>• Números verdes são seus números confirmados</p>
        <p>• Números cinza estão ocupados por outros usuários</p>
        <p>• Você tem 3 dias para realizar o pagamento após reservar</p>
        <p>• Números não pagos serão liberados automaticamente</p>
      </div>
    </div>
  )
}

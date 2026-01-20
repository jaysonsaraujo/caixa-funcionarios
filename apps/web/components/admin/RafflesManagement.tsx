'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Label } from '@/components/shared/Label'
import { formatCurrency } from '@/lib/utils'

export function RafflesManagement() {
  const [raffle, setRaffle] = useState<any>(null)
  const [resultadoLoteria, setResultadoLoteria] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()

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
      }
      setLoading(false)
    }

    loadRaffle()
  }, [supabase, mesAtual, anoAtual])

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
    </div>
  )
}

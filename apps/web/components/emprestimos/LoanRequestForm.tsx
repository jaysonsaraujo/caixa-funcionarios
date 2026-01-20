'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Label } from '@/components/shared/Label'
import { formatCurrency, formatDate } from '@/lib/utils'

interface LoanRequestFormProps {
  isCotista: boolean
  juroEmprestimo: number
  maxValue: number
}

export function LoanRequestForm({
  isCotista,
  juroEmprestimo,
  maxValue,
}: LoanRequestFormProps) {
  const [valorSolicitado, setValorSolicitado] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const valor = parseFloat(valorSolicitado) || 0
  const juro = (valor * juroEmprestimo) / 100
  const valorTotal = valor + juro

  // Vencimento até Novembro
  const hoje = new Date()
  const novembro = new Date(hoje.getFullYear(), 10, 1) // Novembro é mês 10 (0-indexed)
  const dataVencimento = novembro

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (valor <= 0 || valor > maxValue) {
      setError(`O valor deve estar entre R$ 0,01 e ${formatCurrency(maxValue)}`)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Usuário não autenticado')
      setLoading(false)
      return
    }

    // Verificar se é Janeiro ou depois (regra de negócio)
    const mesAtual = hoje.getMonth() + 1
    if (mesAtual < 1) {
      setError('Empréstimos só podem ser solicitados a partir de Janeiro')
      setLoading(false)
      return
    }

    // Criar empréstimo
    const { error: loanError } = await supabase.from('loans').insert({
      user_id: user.id,
      valor_solicitado: valor,
      valor_total_devolver: valorTotal,
      data_vencimento: dataVencimento.toISOString().split('T')[0],
      juro_aplicado: juroEmprestimo,
      status: 'pendente',
      tipo: isCotista ? 'cotista' : 'nao_cotista',
    })

    if (loanError) {
      setError(loanError.message)
      setLoading(false)
      return
    }

    setValorSolicitado('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
      )}
      <div className="space-y-2">
        <Label htmlFor="valorSolicitado">Valor Solicitado</Label>
        <Input
          id="valorSolicitado"
          type="number"
          step="0.01"
          min="0.01"
          max={maxValue}
          value={valorSolicitado}
          onChange={(e) => setValorSolicitado(e.target.value)}
          placeholder="0.00"
          required
        />
        <p className="text-sm text-gray-600">
          Valor máximo disponível: {formatCurrency(maxValue)}
        </p>
      </div>

      <div className="space-y-2">
        <div className="p-4 bg-gray-50 rounded-md space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Valor solicitado:</span>
            <span className="text-sm font-medium">{formatCurrency(valor)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Juro ({juroEmprestimo}%):</span>
            <span className="text-sm font-medium text-red-600">{formatCurrency(juro)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-bold text-gray-900">Total a devolver:</span>
            <span className="font-bold text-gray-900">{formatCurrency(valorTotal)}</span>
          </div>
          <div className="text-xs text-gray-600">
            Vencimento: {formatDate(dataVencimento.toISOString())} (até Novembro)
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading || valor <= 0}>
        {loading ? 'Solicitando...' : 'Solicitar Empréstimo'}
      </Button>

      <p className="text-xs text-gray-500">
        O empréstimo precisa ser aprovado por um administrador. O valor deve ser devolvido até
        Novembro com juro de {juroEmprestimo}%.
      </p>
    </form>
  )
}

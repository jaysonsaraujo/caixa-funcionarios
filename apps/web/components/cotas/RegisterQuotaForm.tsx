'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Label } from '@/components/shared/Label'
import { formatCurrency, getNthBusinessDay } from '@/lib/utils'

interface RegisterQuotaFormProps {
  valorMinimoCota: number
}

export function RegisterQuotaForm({ valorMinimoCota }: RegisterQuotaFormProps) {
  const [numCotas, setNumCotas] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const valorTotal = numCotas * valorMinimoCota

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

    // Verificar se já possui cotas
    const { data: existingQuota } = await supabase
      .from('quotas')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingQuota) {
      setError('Você já possui cotas cadastradas')
      setLoading(false)
      return
    }

    // Criar quota
    const { data: quota, error: quotaError } = await supabase
      .from('quotas')
      .insert({
        user_id: user.id,
        num_cotas: numCotas,
        valor_por_cota: valorMinimoCota,
        status: 'ativa',
      })
      .select()
      .single()

    if (quotaError) {
      setError(quotaError.message)
      setLoading(false)
      return
    }

    // Atualizar role do usuário para cotista
    await supabase
      .from('users')
      .update({ role: 'cotista' })
      .eq('id', user.id)

    // Criar primeira parcela (próximo mês, 5º dia útil)
    const hoje = new Date()
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
    const dataVencimento = getNthBusinessDay(
      proximoMes.getFullYear(),
      proximoMes.getMonth() + 1,
      5
    )

    const { error: paymentError } = await supabase
      .from('quota_payments')
      .insert({
        quota_id: quota.id,
        mes_referencia: proximoMes.getMonth() + 1,
        ano_referencia: proximoMes.getFullYear(),
        valor_pago: valorTotal,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        status: 'pendente',
        forma_pagamento: 'PIX',
      })

    if (paymentError) {
      setError(paymentError.message)
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">{error}</div>
      )}
      <div className="space-y-2">
        <Label htmlFor="numCotas">Número de Cotas</Label>
        <Input
          id="numCotas"
          type="number"
          min={1}
          value={numCotas}
          onChange={(e) => setNumCotas(parseInt(e.target.value) || 1)}
          required
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Valor mínimo por cota: {formatCurrency(valorMinimoCota)}
        </p>
      </div>
      <div className="p-4 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent dark:from-primary/20 dark:via-accent/10 rounded-xl border-2 border-primary/20 dark:border-primary/30">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor Total Mensal</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(valorTotal)}</p>
      </div>
      <Button type="submit" className="w-full gradient-primary text-white border-0 hover:opacity-90" disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar Cotas'}
      </Button>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Ao cadastrar suas cotas, você será responsável por pagar o valor mensal até o 5º dia útil
        de cada mês.
      </p>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Label } from '@/components/shared/Label'
import { formatCurrency, getNthBusinessDay } from '@/lib/utils'

interface AddQuotasFormProps {
  currentQuotas: number
  valorPorCota: number
  quotaId: string
}

export function AddQuotasForm({ currentQuotas, valorPorCota, quotaId }: AddQuotasFormProps) {
  const [additionalQuotas, setAdditionalQuotas] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const valorTotal = additionalQuotas * valorPorCota
  const newTotalQuotas = currentQuotas + additionalQuotas

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (additionalQuotas <= 0) {
      setError('O número de cotas adicionais deve ser maior que zero')
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

    // Verificar se a quota ainda existe e está ativa
    const { data: quota, error: quotaError } = await supabase
      .from('quotas')
      .select('*')
      .eq('id', quotaId)
      .eq('user_id', user.id)
      .single()

    if (quotaError || !quota) {
      setError('Quota não encontrada')
      setLoading(false)
      return
    }

    if (quota.status !== 'ativa') {
      setError('Não é possível adicionar cotas a uma quota inativa')
      setLoading(false)
      return
    }

    // Atualizar número de cotas
    const { error: updateError } = await supabase
      .from('quotas')
      .update({ num_cotas: newTotalQuotas })
      .eq('id', quotaId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Criar pagamentos futuros para as novas cotas
    // Buscar pagamentos futuros existentes para saber até quando criar
    const hoje = new Date()
    const { data: futurePayments } = await supabase
      .from('quota_payments')
      .select('mes_referencia, ano_referencia')
      .eq('quota_id', quotaId)
      .gte('data_vencimento', hoje.toISOString().split('T')[0])
      .order('ano_referencia', { ascending: true })
      .order('mes_referencia', { ascending: true })

    if (futurePayments && futurePayments.length > 0) {
      // Atualizar pagamentos futuros existentes com o novo valor
      // Apenas atualizar pagamentos pendentes (não pagos)
      const novoValor = newTotalQuotas * valorPorCota

      for (const payment of futurePayments) {
        await supabase
          .from('quota_payments')
          .update({ valor_pago: novoValor })
          .eq('quota_id', quotaId)
          .eq('mes_referencia', payment.mes_referencia)
          .eq('ano_referencia', payment.ano_referencia)
          .in('status', ['pendente', 'aguardando_confirmacao'])
      }
    } else {
      // Criar pagamento para o próximo mês se não houver pagamentos futuros
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
      const dataVencimento = getNthBusinessDay(
        proximoMes.getFullYear(),
        proximoMes.getMonth() + 1,
        5
      )

      await supabase.from('quota_payments').insert({
        quota_id: quotaId,
        mes_referencia: proximoMes.getMonth() + 1,
        ano_referencia: proximoMes.getFullYear(),
        valor_pago: newTotalQuotas * valorPorCota,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        status: 'pendente',
        forma_pagamento: 'PIX',
      })
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">{error}</div>
      )}
      <div className="space-y-2">
        <Label htmlFor="additionalQuotas">Número de Cotas Adicionais</Label>
        <Input
          id="additionalQuotas"
          type="number"
          min={1}
          value={additionalQuotas}
          onChange={(e) => setAdditionalQuotas(parseInt(e.target.value) || 1)}
          required
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Cotas atuais: {currentQuotas} | Após adicionar: {newTotalQuotas} cotas
        </p>
      </div>
      <div className="p-4 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent dark:from-primary/20 dark:via-accent/10 rounded-xl border-2 border-primary/20 dark:border-primary/30 space-y-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor Adicional Mensal</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(valorTotal)}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Novo valor total mensal: {formatCurrency(newTotalQuotas * valorPorCota)}
        </p>
      </div>
      <Button type="submit" className="w-full gradient-primary text-white border-0 hover:opacity-90" disabled={loading}>
        {loading ? 'Adicionando...' : 'Adicionar Cotas'}
      </Button>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        As novas cotas serão consideradas a partir do próximo mês. Os pagamentos futuros serão
        atualizados automaticamente.
      </p>
    </form>
  )
}

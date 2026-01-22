'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { formatCurrency } from '@/lib/utils'

interface CancelQuotaFormProps {
  quotaId: string
  numCotas: number
  valorPorCota: number
}

export function CancelQuotaForm({ quotaId, numCotas, valorPorCota }: CancelQuotaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const requiredText = 'CANCELAR COTAS'

  const checkCanCancel = async () => {
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Usuário não autenticado')
      return false
    }

    // Verificar se há pagamentos pendentes ou em atraso
    const { data: pendingPayments } = await supabase
      .from('quota_payments')
      .select('*')
      .eq('quota_id', quotaId)
      .in('status', ['pendente', 'aguardando_confirmacao', 'atrasado'])

    if (pendingPayments && pendingPayments.length > 0) {
      const totalPendente = pendingPayments.reduce(
        (sum, p) => sum + Number(p.valor_pago),
        0
      )
      setError(
        `Não é possível cancelar as cotas. Você possui ${pendingPayments.length} pagamento(s) pendente(s) no valor total de ${formatCurrency(totalPendente)}. Por favor, quite todos os pagamentos antes de cancelar.`
      )
      return false
    }

    return true
  }

  const handleCancel = async () => {
    if (confirmText !== requiredText) {
      setError(`Por favor, digite "${requiredText}" para confirmar`)
      return
    }

    setLoading(true)
    setError(null)

    const canCancel = await checkCanCancel()
    if (!canCancel) {
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

    // Marcar quota como inativa
    const { error: updateError } = await supabase
      .from('quotas')
      .update({ status: 'inativa' })
      .eq('id', quotaId)
      .eq('user_id', user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Atualizar role do usuário para não_cotista
    await supabase
      .from('users')
      .update({ role: 'nao_cotista' })
      .eq('id', user.id)

    router.refresh()
  }

  const handleShowConfirm = async () => {
    setError(null)
    const canCancel = await checkCanCancel()
    if (canCancel) {
      setShowConfirm(true)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
      )}

      {!showConfirm ? (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl">
            <p className="text-sm font-bold text-yellow-900 dark:text-yellow-200 mb-2">
              ⚠️ Atenção: Cancelamento de Cotas
            </p>
            <ul className="text-sm text-yellow-900 dark:text-yellow-100 space-y-1 list-disc list-inside font-medium">
              <li>Você não poderá mais participar de sorteios como cotista</li>
              <li>Os juros de empréstimos voltarão a ser de não cotista</li>
              <li>Não será possível reativar as cotas automaticamente</li>
              <li>Você precisará cadastrar novas cotas se desejar voltar a ser cotista</li>
            </ul>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
            onClick={handleShowConfirm}
          >
            Cancelar Minhas Cotas
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl">
            <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-2">
              Confirmação de Cancelamento
            </p>
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Você está prestes a cancelar {numCotas} cota(s) com valor mensal de{' '}
              {formatCurrency(numCotas * valorPorCota)}.
            </p>
            <p className="text-sm font-bold text-red-900 dark:text-red-100 mt-2">
              Esta ação não pode ser desfeita!
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Digite <strong>{requiredText}</strong> para confirmar:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
              placeholder={requiredText}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowConfirm(false)
                setConfirmText('')
                setError(null)
              }}
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              type="button"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCancel}
              disabled={loading || confirmText !== requiredText}
            >
              {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

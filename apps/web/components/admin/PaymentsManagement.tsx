'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Payment {
  id: string
  quota_id: string
  mes_referencia: number
  ano_referencia: number
  valor_pago: number
  data_vencimento: string
  status: string
  forma_pagamento: string
  comprovante_url: string | null
  quotas: {
    user_id: string
    users: {
      full_name: string | null
      email: string
    }
  }
}

export function PaymentsManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadPayments = async () => {
      const { data } = await supabase
        .from('quota_payments')
        .select(
          `
          *,
          quotas!inner(
            user_id,
            users(full_name, email)
          )
        `
        )
        .eq('status', 'aguardando_confirmacao')
        .order('data_vencimento', { ascending: true })
        .limit(20)

      if (data) {
        setPayments(data as any)
      }
      setLoading(false)
    }

    loadPayments()
  }, [supabase])

  const confirmPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('quota_payments')
      .update({
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0],
      })
      .eq('id', paymentId)

    if (!error) {
      setPayments((prev) => prev.filter((p) => p.id !== paymentId))
    }
  }

  const rejectPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('quota_payments')
      .update({
        status: 'pendente',
        comprovante_url: null,
      })
      .eq('id', paymentId)

    if (!error) {
      setPayments((prev) => prev.filter((p) => p.id !== paymentId))
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="p-4 border rounded-lg space-y-2"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                {payment.quotas?.users?.full_name || payment.quotas?.users?.email}
              </p>
              <p className="text-sm text-gray-600">
                {payment.mes_referencia}/{payment.ano_referencia} -{' '}
                {formatCurrency(payment.valor_pago)}
              </p>
              <p className="text-xs text-gray-500">
                Vencimento: {formatDate(payment.data_vencimento)} |{' '}
                {payment.forma_pagamento}
              </p>
              {payment.comprovante_url && (
                <a
                  href={payment.comprovante_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Ver comprovante
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => rejectPayment(payment.id)}>
                Rejeitar
              </Button>
              <Button size="sm" onClick={() => confirmPayment(payment.id)}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      ))}
      {payments.length === 0 && (
        <p className="text-sm text-gray-600">Nenhum pagamento pendente</p>
      )}
    </div>
  )
}

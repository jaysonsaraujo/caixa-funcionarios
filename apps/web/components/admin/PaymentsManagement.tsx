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
    return <div className="text-sm text-gray-600 dark:text-gray-400">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {payments.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
          Total de pagamentos aguardando confirmação: {payments.length}
        </div>
      )}
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="p-5 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full gradient-success flex items-center justify-center text-white font-bold text-sm">
                  {(payment.quotas?.users?.full_name || payment.quotas?.users?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {payment.quotas?.users?.full_name || payment.quotas?.users?.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{payment.quotas?.users?.email}</p>
                </div>
              </div>
              <div className="ml-12 space-y-1">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(payment.valor_pago)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Referência: {payment.mes_referencia}/{payment.ano_referencia}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Vencimento: {formatDate(payment.data_vencimento)} | {payment.forma_pagamento}
                </p>
                {payment.comprovante_url && (
                  <a
                    href={payment.comprovante_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver comprovante
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => rejectPayment(payment.id)}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                Rejeitar
              </Button>
              <Button 
                size="sm" 
                onClick={() => confirmPayment(payment.id)}
                className="gradient-success text-white border-0 hover:opacity-90"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      ))}
      {payments.length === 0 && !loading && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">Nenhum pagamento pendente</p>
      )}
    </div>
  )
}

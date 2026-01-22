'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Label } from '@/components/shared/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/Select'
import { formatCurrency } from '@/lib/utils'

interface RafflePaymentFormProps {
  ticketId: string
  valor: number
  disabled?: boolean
}

export function RafflePaymentForm({ ticketId, valor, disabled }: RafflePaymentFormProps) {
  const [formaPagamento, setFormaPagamento] = useState<'PIX' | 'dinheiro'>('PIX')
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let comprovanteUrl: string | null = null

    if (comprovante && formaPagamento === 'PIX') {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
        setLoading(false)
        return
      }

      const fileExt = comprovante.name.split('.').pop()
      const fileName = `${user.id}/${ticketId}.${fileExt}`
      const filePath = `sorteios/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, comprovante, {
          upsert: true,
        })

      if (uploadError) {
        setError('Erro ao fazer upload do comprovante: ' + uploadError.message)
        setLoading(false)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('comprovantes').getPublicUrl(filePath)

      comprovanteUrl = publicUrl
    }

    const { error: updateError } = await supabase
      .from('raffle_tickets')
      .update({
        forma_pagamento: formaPagamento,
        comprovante_url: comprovanteUrl,
        pagamento_status: 'aguardando_confirmacao',
      })
      .eq('id', ticketId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`formaPagamento-${ticketId}`}>Forma de Pagamento</Label>
          <Select
            value={formaPagamento}
            onValueChange={(value) => setFormaPagamento(value as 'PIX' | 'dinheiro')}
            disabled={disabled || loading}
          >
            <SelectTrigger id={`formaPagamento-${ticketId}`} className="transition-all focus:ring-2 focus:ring-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`comprovante-${ticketId}`}>Comprovante (opcional)</Label>
          <input
            id={`comprovante-${ticketId}`}
            type="file"
            accept="image/*,.pdf"
            disabled={disabled || loading || formaPagamento !== 'PIX'}
            onChange={(e) => setComprovante(e.target.files?.[0] || null)}
            className="block w-full text-xs text-gray-600 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/20 dark:file:text-primary hover:file:bg-primary/20 transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-primary/20 dark:border-primary/40 bg-primary/5 dark:bg-primary/10 px-3 py-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Valor do número</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(valor)}</span>
      </div>
      <Button
        type="submit"
        size="sm"
        className="w-full gradient-primary text-white border-0 hover:opacity-90"
        disabled={disabled || loading}
      >
        {loading ? 'Enviando...' : 'Registrar Pagamento'}
      </Button>
    </form>
  )
}

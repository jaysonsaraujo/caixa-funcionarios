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

interface PaymentFormProps {
  paymentId: string
  valor: number
}

export function PaymentForm({ paymentId, valor }: PaymentFormProps) {
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

    // Upload do comprovante se houver
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
      const fileName = `${user.id}/${paymentId}.${fileExt}`
      const filePath = `comprovantes/${fileName}`

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

    // Atualizar pagamento
    const { error: updateError } = await supabase
      .from('quota_payments')
      .update({
        forma_pagamento: formaPagamento,
        comprovante_url: comprovanteUrl,
        status: 'aguardando_confirmacao',
      })
      .eq('id', paymentId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-xl border-2 border-red-200 dark:border-red-700">{error}</div>
      )}
      <div className="space-y-2">
        <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
        <Select
          value={formaPagamento}
          onValueChange={(value) => setFormaPagamento(value as 'PIX' | 'dinheiro')}
        >
          <SelectTrigger id="formaPagamento" className="transition-all focus:ring-2 focus:ring-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PIX">PIX</SelectItem>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formaPagamento === 'PIX' && (
        <div className="space-y-2">
          <Label htmlFor="comprovante">Comprovante (opcional)</Label>
          <input
            id="comprovante"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setComprovante(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/20 dark:file:text-primary hover:file:bg-primary/20 transition-colors"
          />
        </div>
      )}
      <div className="p-4 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent dark:from-primary/20 dark:via-accent/10 dark:to-primary/5 rounded-xl border-2 border-primary/20 dark:border-primary/40">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Valor a pagar</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(valor)}</p>
      </div>
      <Button 
        type="submit" 
        className="w-full gradient-primary text-white border-0 hover:opacity-90" 
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Registrar Pagamento'}
      </Button>
    </form>
  )
}

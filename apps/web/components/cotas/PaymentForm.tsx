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
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
      )}
      <div className="space-y-2">
        <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
        <Select
          value={formaPagamento}
          onValueChange={(value) => setFormaPagamento(value as 'PIX' | 'dinheiro')}
        >
          <SelectTrigger id="formaPagamento">
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
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      )}
      <div className="p-3 bg-gray-50 rounded-md">
        <p className="text-sm font-medium text-gray-700">Valor a pagar</p>
        <p className="text-xl font-bold text-gray-900">{formatCurrency(valor)}</p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Enviando...' : 'Registrar Pagamento'}
      </Button>
    </form>
  )
}

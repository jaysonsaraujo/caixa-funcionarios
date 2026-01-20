'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Label } from '@/components/shared/Label'

interface SystemConfig {
  id: string
  juro_atraso_cota: number
  juro_emprestimo_cotista: number
  juro_emprestimo_nao_cotista: number
  valor_premio_sorteio: number
  valor_minimo_cota: number
  valor_bilhete_sorteio: number
  max_admins: number
}

export function SystemConfig() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase
        .from('system_config')
        .select('*')
        .single()

      if (data) {
        setConfig(data)
      }
      setLoading(false)
    }

    loadConfig()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    setSaving(true)
    const { error } = await supabase
      .from('system_config')
      .update(config)
      .eq('id', config.id)

    if (!error) {
      alert('Configurações salvas com sucesso!')
    } else {
      alert('Erro ao salvar configurações: ' + error.message)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Carregando...</div>
  }

  if (!config) {
    return <p className="text-sm text-gray-600">Configurações não encontradas</p>
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="juro_atraso_cota">Juro por Atraso de Cota (%)</Label>
          <Input
            id="juro_atraso_cota"
            type="number"
            step="0.01"
            value={config.juro_atraso_cota}
            onChange={(e) =>
              setConfig({ ...config, juro_atraso_cota: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="juro_emprestimo_cotista">Juro Empréstimo Cotista (%)</Label>
          <Input
            id="juro_emprestimo_cotista"
            type="number"
            step="0.01"
            value={config.juro_emprestimo_cotista}
            onChange={(e) =>
              setConfig({
                ...config,
                juro_emprestimo_cotista: parseFloat(e.target.value) || 0,
              })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="juro_emprestimo_nao_cotista">Juro Empréstimo Não Cotista (%)</Label>
          <Input
            id="juro_emprestimo_nao_cotista"
            type="number"
            step="0.01"
            value={config.juro_emprestimo_nao_cotista}
            onChange={(e) =>
              setConfig({
                ...config,
                juro_emprestimo_nao_cotista: parseFloat(e.target.value) || 0,
              })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_premio_sorteio">Valor do Prêmio do Sorteio (R$)</Label>
          <Input
            id="valor_premio_sorteio"
            type="number"
            step="0.01"
            value={config.valor_premio_sorteio}
            onChange={(e) =>
              setConfig({ ...config, valor_premio_sorteio: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_minimo_cota">Valor Mínimo por Cota (R$)</Label>
          <Input
            id="valor_minimo_cota"
            type="number"
            step="0.01"
            value={config.valor_minimo_cota}
            onChange={(e) =>
              setConfig({ ...config, valor_minimo_cota: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_bilhete_sorteio">Valor do Bilhete do Sorteio (R$)</Label>
          <Input
            id="valor_bilhete_sorteio"
            type="number"
            step="0.01"
            value={config.valor_bilhete_sorteio}
            onChange={(e) =>
              setConfig({ ...config, valor_bilhete_sorteio: parseFloat(e.target.value) || 0 })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_admins">Máximo de Administradores</Label>
          <Input
            id="max_admins"
            type="number"
            min="1"
            max="4"
            value={config.max_admins}
            onChange={(e) =>
              setConfig({ ...config, max_admins: parseInt(e.target.value) || 1 })
            }
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </form>
  )
}

'use client'

import { useEffect } from 'react'
import { getVersion } from '@/lib/utils/version'

const STORAGE_KEY = 'caixa-funcionarios-last-seen-version'
const STORAGE_CHANGE_EVENT = 'version-seen-updated'

export function MarkVersionSeen() {
  useEffect(() => {
    // Marcar versão atual como vista quando a página de changelog é carregada
    getVersion().then((version) => {
      if (typeof window !== 'undefined' && version) {
        localStorage.setItem(STORAGE_KEY, version)
        // Disparar evento customizado para atualizar badge
        window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT))
      }
    })
  }, [])

  return null
}

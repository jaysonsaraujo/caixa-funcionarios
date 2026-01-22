'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getVersion } from '@/lib/utils/version'

const STORAGE_KEY = 'caixa-funcionarios-last-seen-version'
const STORAGE_CHANGE_EVENT = 'version-seen-updated'

function compareVersions(version1: string, version2: string): number {
  const v1 = version1.split('.').map(Number)
  const v2 = version2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const part1 = v1[i] || 0
    const part2 = v2[i] || 0
    if (part2 !== part1) {
      return part2 - part1
    }
  }
  return 0
}

function hasNewVersion(currentVersion: string): boolean {
  if (typeof window === 'undefined') return false
  
  const lastSeenVersion = localStorage.getItem(STORAGE_KEY)
  
  if (!lastSeenVersion) {
    // Primeira vez - não mostrar notificação, será marcado quando visualizar changelog
    return false
  }
  
  // Se a versão atual é maior que a última vista, há nova versão
  return compareVersions(currentVersion, lastSeenVersion) > 0
}

function checkVersion(currentVersion: string): boolean {
  return hasNewVersion(currentVersion)
}

export function VersionBadge() {
  const [version, setVersion] = useState<string>('')
  const [hasNew, setHasNew] = useState(false)

  useEffect(() => {
    getVersion().then((v) => {
      setVersion(v)
      setHasNew(checkVersion(v))
    })
  }, [])

  useEffect(() => {
    // Ouvir eventos de mudança quando versão é marcada como vista
    const handleStorageChange = () => {
      if (version) {
        setHasNew(checkVersion(version))
      }
    }

    // Evento customizado quando versão é marcada como vista
    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange)
    
    // Evento padrão do localStorage (para outras abas)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [version])

  if (!version) {
    return null
  }

  return (
    <Link
      href="/changelog"
      className="relative inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
      title={hasNew ? 'Nova versão disponível! Clique para ver novidades' : 'Ver histórico de atualizações'}
    >
      v{version}
      {hasNew && (
        <span
          className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse"
          aria-label="Nova versão disponível"
        />
      )}
    </Link>
  )
}

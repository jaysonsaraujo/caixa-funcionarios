'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getVersion } from '@/lib/utils/version'

export function VersionBadge() {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    getVersion().then(setVersion)
  }, [])

  if (!version) {
    return null
  }

  return (
    <Link
      href="/changelog"
      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
      title="Ver histórico de atualizações"
    >
      v{version}
    </Link>
  )
}

/**
 * Utilitário para obter a versão do sistema
 */

let cachedVersion: string | null = null

// Versão padrão - sincronizar com VERSION e package.json
const DEFAULT_VERSION = '1.0.0'

export async function getVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion
  }

  // Em Next.js, preferir usar variáveis de ambiente ou valores fixos
  // para evitar problemas com require() em diferentes contextos
  cachedVersion = process.env.NEXT_PUBLIC_APP_VERSION || DEFAULT_VERSION
  return cachedVersion
}

export function getVersionSync(): string {
  if (cachedVersion) {
    return cachedVersion
  }

  // Versão sincronizada - usar valor padrão ou variável de ambiente
  cachedVersion = process.env.NEXT_PUBLIC_APP_VERSION || DEFAULT_VERSION
  return cachedVersion
}

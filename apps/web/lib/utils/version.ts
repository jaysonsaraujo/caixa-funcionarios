/**
 * Utilitário para obter a versão do sistema
 * Lê automaticamente do package.json
 */

import packageJson from '../../package.json'

let cachedVersion: string | null = null

export async function getVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion
  }

  // Ler do package.json do web app
  cachedVersion = packageJson.version || '1.0.0'
  return cachedVersion
}

export function getVersionSync(): string {
  if (cachedVersion) {
    return cachedVersion
  }

  // Ler do package.json do web app (sincronizado)
  cachedVersion = packageJson.version || '1.0.0'
  return cachedVersion
}

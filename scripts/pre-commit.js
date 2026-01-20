#!/usr/bin/env node

/**
 * Script para ser executado antes de cada commit
 * Incrementa a versão PATCH automaticamente
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const VERSION_FILE = path.join(__dirname, '..', 'VERSION')

function readVersion() {
  try {
    return fs.readFileSync(VERSION_FILE, 'utf8').trim()
  } catch (error) {
    console.error('Erro ao ler arquivo VERSION:', error.message)
    process.exit(1)
  }
}

function main() {
  try {
    // Verificar se estamos em um repositório git
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' })
    } catch {
      // Não é um repositório git, sair silenciosamente
      process.exit(0)
    }

    // Verificar se há mudanças para commitar
    try {
      const status = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      if (!status.trim()) {
        // Nenhum arquivo staged, não incrementar versão
        process.exit(0)
      }
    } catch {
      // Primeiro commit ou erro, continuar
    }

    const currentVersion = readVersion()
    console.log(`Versão atual antes do commit: ${currentVersion}`)

    // Incrementar versão patch
    const [major, minor, patch] = currentVersion.split('.').map(Number)
    const newVersion = `${major}.${minor}.${patch + 1}`
    
    console.log(`Incrementando versão: ${currentVersion} → ${newVersion}`)

    // Executar o script de versionamento
    execSync(`node scripts/version.js patch`, { stdio: 'inherit' })

    // Adicionar arquivos de versão atualizados ao commit
    execSync('git add VERSION package.json apps/web/package.json', { stdio: 'inherit' })

    console.log(`✅ Versão atualizada para ${newVersion} e adicionada ao commit`)
  } catch (error) {
    console.error('Erro no pre-commit hook:', error.message)
    process.exit(1)
  }
}

main()

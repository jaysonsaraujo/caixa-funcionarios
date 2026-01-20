#!/usr/bin/env node

/**
 * Script para ser executado antes de cada commit
 * Incrementa a versão PATCH automaticamente (a menos que o commit tenha [skip-version])
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
    let hasChanges = false
    try {
      const status = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      hasChanges = status.trim().length > 0
    } catch {
      // Erro ao verificar, assumir que há mudanças
      hasChanges = true
    }

    if (!hasChanges) {
      // Nenhum arquivo staged, não incrementar versão
      process.exit(0)
    }

    // Verificar mensagem de commit (se disponível)
    try {
      const commitMsgFile = process.env.GIT_PARAMS || '.git/COMMIT_EDITMSG'
      if (fs.existsSync(commitMsgFile)) {
        const commitMsg = fs.readFileSync(commitMsgFile, 'utf8').toLowerCase()
        if (commitMsg.includes('[skip-version]') || commitMsg.includes('[no-bump]')) {
          console.log('⏭️  Versão não incrementada (flag [skip-version] encontrada)')
          process.exit(0)
        }
      }
    } catch {
      // Ignorar erros na leitura da mensagem de commit
    }

    // Verificar se arquivos de versão já estão sendo commitados (evitar loop)
    try {
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      if (stagedFiles.includes('VERSION')) {
        // VERSION já está no commit, não incrementar novamente
        console.log('⏭️  Versão já está no commit, pulando incremento automático')
        process.exit(0)
      }
    } catch {
      // Continuar se houver erro
    }

    const currentVersion = readVersion()
    console.log(`📦 Versão atual: ${currentVersion}`)

    // Incrementar versão patch
    const [major, minor, patch] = currentVersion.split('.').map(Number)
    const newVersion = `${major}.${minor}.${patch + 1}`
    
    console.log(`⬆️  Incrementando versão: ${currentVersion} → ${newVersion}`)

    // Executar o script de versionamento
    execSync(`node scripts/version.js patch`, { stdio: 'inherit' })

    // Adicionar arquivos de versão atualizados ao commit
    execSync('git add VERSION package.json apps/web/package.json', { stdio: 'inherit' })

    console.log(`✅ Versão atualizada para ${newVersion} e adicionada ao commit`)
  } catch (error) {
    console.error('❌ Erro no pre-commit hook:', error.message)
    // Não falhar o commit em caso de erro
    process.exit(0)
  }
}

main()

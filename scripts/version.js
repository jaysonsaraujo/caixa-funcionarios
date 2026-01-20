#!/usr/bin/env node

/**
 * Script de gerenciamento de versão semântica (Semantic Versioning)
 * 
 * Uso:
 *   node scripts/version.js          # Mostra versão atual
 *   node scripts/version.js patch    # Incrementa patch (1.0.0 -> 1.0.1)
 *   node scripts/version.js minor    # Incrementa minor (1.0.0 -> 1.1.0)
 *   node scripts/version.js major    # Incrementa major (1.0.0 -> 2.0.0)
 */

const fs = require('fs')
const path = require('path')

const VERSION_FILE = path.join(__dirname, '..', 'VERSION')
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json')
const WEB_PACKAGE_JSON = path.join(__dirname, '..', 'apps', 'web', 'package.json')

function readVersion() {
  try {
    const version = fs.readFileSync(VERSION_FILE, 'utf8').trim()
    return version
  } catch (error) {
    console.error('Erro ao ler arquivo VERSION:', error.message)
    process.exit(1)
  }
}

function writeVersion(version) {
  try {
    fs.writeFileSync(VERSION_FILE, version + '\n', 'utf8')
    console.log(`Versão atualizada para: ${version}`)
    
    // Atualizar package.json do root
    if (fs.existsSync(PACKAGE_JSON)) {
      const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'))
      packageJson.version = version
      fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n', 'utf8')
    }
    
    // Atualizar package.json do web
    if (fs.existsSync(WEB_PACKAGE_JSON)) {
      const webPackageJson = JSON.parse(fs.readFileSync(WEB_PACKAGE_JSON, 'utf8'))
      webPackageJson.version = version
      fs.writeFileSync(WEB_PACKAGE_JSON, JSON.stringify(webPackageJson, null, 2) + '\n', 'utf8')
    }
  } catch (error) {
    console.error('Erro ao escrever versão:', error.message)
    process.exit(1)
  }
}

function incrementVersion(currentVersion, type) {
  // Validar formato da versão (MAJOR.MINOR.PATCH)
  const versionRegex = /^(\d+)\.(\d+)\.(\d+)$/
  const match = currentVersion.match(versionRegex)
  
  if (!match) {
    console.error(`Formato de versão inválido: ${currentVersion}`)
    console.error('Formato esperado: MAJOR.MINOR.PATCH (ex: 1.0.0)')
    process.exit(1)
  }
  
  let major = parseInt(match[1], 10)
  let minor = parseInt(match[2], 10)
  let patch = parseInt(match[3], 10)
  
  switch (type) {
    case 'patch':
      // Incrementa patch: 1.0.0 -> 1.0.1
      patch++
      break
    case 'minor':
      // Incrementa minor e reseta patch: 1.0.0 -> 1.1.0
      minor++
      patch = 0
      break
    case 'major':
      // Incrementa major e reseta minor e patch: 1.0.0 -> 2.0.0
      major++
      minor = 0
      patch = 0
      break
    default:
      console.error(`Tipo de incremento inválido: ${type}`)
      console.log('Tipos válidos: patch, minor, major')
      process.exit(1)
  }
  
  return `${major}.${minor}.${patch}`
}

// Main
const command = process.argv[2]

if (!command) {
  // Mostrar versão atual
  const version = readVersion()
  console.log(`Versão atual: ${version}`)
  process.exit(0)
}

const currentVersion = readVersion()

switch (command) {
  case 'patch':
  case 'minor':
  case 'major':
    const newVersion = incrementVersion(currentVersion, command)
    writeVersion(newVersion)
    console.log(`Versão atualizada: ${currentVersion} → ${newVersion}`)
    break
  default:
    console.error(`Comando inválido: ${command}`)
    console.log('Comandos disponíveis:')
    console.log('  node scripts/version.js          # Mostra versão atual')
    console.log('  node scripts/version.js patch    # Incrementa patch (1.0.0 -> 1.0.1)')
    console.log('  node scripts/version.js minor    # Incrementa minor (1.0.0 -> 1.1.0)')
    console.log('  node scripts/version.js major    # Incrementa major (1.0.0 -> 2.0.0)')
    process.exit(1)
}

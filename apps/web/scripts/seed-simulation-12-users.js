/**
 * Simulação completa: 12 usuários, 12 meses de cotas, empréstimos, sorteios,
 * divisão de lucros e previsão mês a mês. Gera TABELA_PARTICIPANTES_SIMULACAO.md
 * e PREVISAO_LUCROS_SIMULACAO.md na raiz do projeto.
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.
 * Executar a partir de apps/web: node scripts/seed-simulation-12-users.js
 * Ou: npm run seed:simulation (em apps/web)
 *
 * Execute apenas uma vez. Se já existirem usuários *@caixa.local, remova-os antes.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const WEB_ROOT = path.join(__dirname, '..')
const PROJECT_ROOT = path.join(__dirname, '..', '..')

function loadEnv() {
  for (const root of [WEB_ROOT, PROJECT_ROOT]) {
    const p = path.join(root, '.env.local')
    if (fs.existsSync(p)) {
      fs.readFileSync(p, 'utf8')
        .split('\n')
        .forEach((line) => {
          const m = line.match(/^\s*([^#=]+)=(.*)$/)
          if (m) {
            const k = m[1].trim()
            let v = m[2].trim().replace(/^["']|["']$/g, '')
            if (!process.env[k]) process.env[k] = v
          }
        })
      return
    }
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

const CONFIG = {
  valor_minimo_cota: 50,
  valor_bilhete_sorteio: 10,
  valor_premio_sorteio: 1000,
  juro_atraso_cota: 5,
  juro_emprestimo_cotista: 3,
  juro_emprestimo_nao_cotista: 5,
}

const ANO = new Date().getFullYear()
const MESES = 12
const EMAIL_PREFIX = `simulacao${ANO}`

function getNthBusinessDay(year, month, n) {
  const date = new Date(year, month - 1, 1)
  let businessDays = 0
  while (businessDays < n) {
    const d = date.getDay()
    if (d !== 0 && d !== 6) businessDays++
    if (businessDays < n) date.setDate(date.getDate() + 1)
  }
  return date
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const NOMES = [
  'Ana Silva', 'Bruno Costa', 'Carla Lima', 'Diego Souza', 'Elena Ferreira',
  'Fábio Rocha', 'Gabriela Martins', 'Henrique Alves', 'Isabela Oliveira', 'João Pedro',
  'Larissa Santos', 'Marcos Pereira',
]

async function main() {
  console.log('Iniciando simulação: 12 usuários, 12 meses...\n')

  const participants = []

  for (let i = 1; i <= 12; i++) {
    const email = `${EMAIL_PREFIX}${String(i).padStart(2, '0')}@caixa.local`
    const password = `Simulacao${String(i).padStart(2, '0')}!`
    const fullName = NOMES[i - 1]

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (error) {
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('already') || msg.includes('exists')) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single()
        if (!existingUser?.id) {
          console.error(`Erro ao criar ${email}:`, error.message)
          continue
        }
        const id = existingUser.id
        participants.push({ id, email, password, fullName, index: i })
        await supabase.from('users').update({ role: 'cotista', full_name: fullName }).eq('id', id)
        console.log(`Usuário ${i}/12 (reaproveitado): ${email}`)
      } else {
        console.error(`Erro ao criar ${email}:`, error.message)
        continue
      }
    } else {
      const id = data.user.id
      participants.push({ id, email, password, fullName, index: i })
      await supabase.from('users').update({ role: 'cotista', full_name: fullName }).eq('id', id)
      console.log(`Usuário ${i}/12: ${email}`)
    }
  }

  if (participants.length !== 12) {
    console.error('Não foi possível criar os 12 usuários. Abortando.')
    process.exit(1)
  }

  const idByIndex = (i) => participants[i - 1].id

  const quotas = []
  const numCotasByUser = [2, 3, 1, 4, 2, 5, 1, 3, 4, 2, 3, 2]
  const valorCotaByUser = [50, 60, 55, 50, 70, 55, 80, 60, 50, 65, 55, 75]

  for (let i = 0; i < 12; i++) {
    const userId = idByIndex(i + 1)
    const { data: q, error } = await supabase
      .from('quotas')
      .upsert({
        user_id: userId,
        num_cotas: numCotasByUser[i],
        valor_por_cota: valorCotaByUser[i],
        status: 'ativa',
        data_cadastro: `${ANO}-01-01`,
      }, { onConflict: 'user_id' })
      .select('id, user_id, num_cotas, valor_por_cota')
      .single()

    if (error) {
      console.error('Erro quota user', i + 1, error.message)
      continue
    }
    quotas.push({ ...q, userIndex: i + 1 })
  }

  const quotaIds = quotas.map((q) => q.id)
  await supabase.from('quota_payments').delete().in('quota_id', quotaIds).eq('ano_referencia', ANO)

  for (const q of quotas) {
    const base = q.num_cotas * q.valor_por_cota
    for (let mes = 1; mes <= MESES; mes++) {
      const venc = getNthBusinessDay(ANO, mes, 5)
      const atrasado = Math.random() < 0.2
      const juro = atrasado ? (base * CONFIG.juro_atraso_cota) / 100 : 0
      const forma = Math.random() < 0.6 ? 'PIX' : 'dinheiro'
      const dataPag = atrasado
        ? new Date(ANO, mes - 1, 10 + Math.floor(Math.random() * 10))
        : new Date(venc)

      const payload = {
        quota_id: q.id,
        mes_referencia: mes,
        ano_referencia: ANO,
        valor_pago: base,
        data_vencimento: venc.toISOString().split('T')[0],
        data_pagamento: dataPag.toISOString().split('T')[0],
        juro_aplicado: juro,
        status: 'pago',
        forma_pagamento: forma,
      }

      const { error } = await supabase.from('quota_payments').insert(payload)
      if (error) console.error('Erro quota_payment', q.userIndex, mes, error.message)
    }
  }
  console.log('Pagamentos de cotas (12 meses) inseridos.')

  const emprestimosPorUser = [
    [800, 1200], [1500], [600, 900], [2000, 500], [1100], [700, 1300, 400],
    [950], [1800, 600], [500, 1000], [1400], [750, 1150], [900],
  ]
  const tipoUser = () => (Math.random() < 0.5 ? 'cotista' : 'nao_cotista')
  const juroPorTipo = (t) => (t === 'cotista' ? CONFIG.juro_emprestimo_cotista : CONFIG.juro_emprestimo_nao_cotista)

  const userIdsSim = participants.map((p) => p.id)
  await supabase
    .from('loans')
    .delete()
    .in('user_id', userIdsSim)
    .gte('data_solicitacao', `${ANO}-01-01`)
    .lte('data_solicitacao', `${ANO}-12-31`)

  for (let i = 0; i < 12; i++) {
    const userId = idByIndex(i + 1)
    const lista = emprestimosPorUser[i] || [1000]
    for (const valor of lista) {
      const tipo = tipoUser()
      const juroPct = juroPorTipo(tipo)
      const juroVal = (valor * juroPct) / 100
      const total = valor + juroVal
      const mesEmp = 2 + Math.floor(Math.random() * 8)
      const sol = new Date(ANO, mesEmp - 1, 5)
      const venc = new Date(ANO, mesEmp, 5)
      const quitado = Math.random() < 0.55
      const status = quitado ? 'quitado' : 'aprovado'

      const { error } = await supabase.from('loans').insert({
        user_id: userId,
        valor_solicitado: valor,
        valor_total_devolver: total,
        data_solicitacao: sol.toISOString().split('T')[0],
        data_vencimento: venc.toISOString().split('T')[0],
        juro_aplicado: juroPct,
        status,
        tipo,
      })
      if (error) console.error('Erro loan user', i + 1, error.message)
    }
  }

  for (let mes = 1; mes <= MESES; mes++) {
    const userId = idByIndex(((mes - 1) % 12) + 1)
    const valor = 900 + mes * 25
    const tipo = 'cotista'
    const juroPct = juroPorTipo(tipo)
    const juroVal = (valor * juroPct) / 100
    const total = valor + juroVal
    const sol = new Date(ANO, mes - 1, 8)
    const venc = new Date(ANO, mes, 8)
    const status = mes % 2 === 0 ? 'quitado' : 'aprovado'

    const { error } = await supabase.from('loans').insert({
      user_id: userId,
      valor_solicitado: valor,
      valor_total_devolver: total,
      data_solicitacao: sol.toISOString().split('T')[0],
      data_vencimento: venc.toISOString().split('T')[0],
      juro_aplicado: juroPct,
      status,
      tipo,
    })
    if (error) console.error('Erro loan mensal', mes, error.message)
  }

  console.log('Empréstimos inseridos.')

  const raffleIds = []
  for (let mes = 1; mes <= MESES; mes++) {
    await supabase
      .from('monthly_raffles')
      .upsert(
        {
          mes,
          ano: ANO,
          premio_valor: CONFIG.valor_premio_sorteio,
          status: 'fechado',
        },
        { onConflict: 'mes,ano', ignoreDuplicates: true }
      )

    const { data: r, error } = await supabase
      .from('monthly_raffles')
      .select('id, mes, ano, status')
      .eq('mes', mes)
      .eq('ano', ANO)
      .single()

    if (error) {
      console.error('Erro monthly_raffle', mes, error.message)
      continue
    }
    raffleIds.push({ id: r.id, mes })
  }

  if (raffleIds.length > 0) {
    await supabase
      .from('raffle_tickets')
      .delete()
      .in('raffle_id', raffleIds.map((r) => r.id))
  }

  const usedByRaffle = {}
  for (const r of raffleIds) {
    usedByRaffle[r.id] = new Set()
  }

  for (const r of raffleIds) {
    const ticketsPerUser = [1, 3, 2, 4, 1, 2, 3, 2, 1, 4, 2, 3]
    for (let u = 0; u < 12; u++) {
      const n = ticketsPerUser[u] ?? 2
      let count = 0
      while (count < n) {
        const num = 1 + Math.floor(Math.random() * 100)
        if (usedByRaffle[r.id].has(num)) continue
        usedByRaffle[r.id].add(num)
        count++
        const userId = idByIndex(u + 1)
        const vencRes = new Date(ANO, r.mes - 1, 4)
        vencRes.setHours(23, 59, 59, 999)
        const { error } = await supabase.from('raffle_tickets').insert({
          raffle_id: r.id,
          user_id: userId,
          numero_escolhido: num,
          valor_pago: CONFIG.valor_bilhete_sorteio,
          data_vencimento_reserva: vencRes.toISOString(),
          status: 'confirmado',
          pagamento_status: 'pago',
          forma_pagamento: Math.random() < 0.6 ? 'PIX' : 'dinheiro',
          data_pagamento: new Date(ANO, r.mes - 1, 3).toISOString().split('T')[0],
        })
        if (error) console.error('Erro raffle_ticket', r.mes, u + 1, num, error.message)
      }
    }
  }
  console.log('Sorteios e bilhetes inseridos.')

  for (const r of raffleIds) {
    const numerosDisponiveis = Array.from(usedByRaffle[r.id] || [])
    const numeroSorteado =
      numerosDisponiveis.length > 0
        ? numerosDisponiveis[Math.floor(Math.random() * numerosDisponiveis.length)]
        : 1
    const prefixo = String(1000 + Math.floor(Math.random() * 9000))
    const resultadoLoteria = `${prefixo}${String(numeroSorteado).padStart(2, '0')}`
    const dataSorteio = new Date(ANO, r.mes - 1, 6)
    await supabase
      .from('monthly_raffles')
      .update({
        status: 'sorteado',
        resultado_loteria: resultadoLoteria,
        numero_sorteado: numeroSorteado,
        data_sorteio: dataSorteio.toISOString().split('T')[0],
      })
      .eq('id', r.id)
  }
  console.log('Sorteios realizados.\n')

  const raffleIdsSim = raffleIds.map((r) => r.id)

  const { data: payments } = await supabase
    .from('quota_payments')
    .select('quota_id, valor_pago, juro_aplicado, mes_referencia, ano_referencia, status')
    .eq('ano_referencia', ANO)
    .eq('status', 'pago')
    .in('quota_id', quotaIds)

  const { data: loans } = await supabase
    .from('loans')
    .select('user_id, valor_solicitado, valor_total_devolver, data_vencimento, status')
    .eq('status', 'quitado')
    .in('user_id', userIdsSim)

  const { data: tickets } = await supabase
    .from('raffle_tickets')
    .select('raffle_id, user_id, valor_pago')
    .eq('pagamento_status', 'pago')
    .in('raffle_id', raffleIdsSim)

  const { data: raffles } = await supabase
    .from('monthly_raffles')
    .select('id, mes, ano, premio_valor, status')
    .eq('ano', ANO)
    .eq('status', 'sorteado')
    .in('id', raffleIdsSim)

  const quotaIdToUserId = {}
  for (const q of quotas) quotaIdToUserId[q.id] = q.user_id
  const raffleIdToMes = {}
  for (const r of raffleIds) raffleIdToMes[r.id] = r.mes

  const receitaCotasPorMes = Array(MESES + 1).fill(0)
  const receitaEmpPorMes = Array(MESES + 1).fill(0)
  const receitaBilhetesPorMes = Array(MESES + 1).fill(0)
  const despesaPremiosPorMes = Array(MESES + 1).fill(0)

  for (const p of payments || []) {
    const m = p.mes_referencia
    const tot = (p.valor_pago || 0) + (p.juro_aplicado || 0)
    receitaCotasPorMes[m] += tot
  }

  for (const l of loans || []) {
    const juro = (l.valor_total_devolver || 0) - (l.valor_solicitado || 0)
    const mes = l.data_vencimento ? new Date(l.data_vencimento).getMonth() + 1 : 6
    if (mes >= 1 && mes <= MESES) receitaEmpPorMes[mes] += juro
  }

  for (const t of tickets || []) {
    const m = raffleIdToMes[t.raffle_id] || 1
    receitaBilhetesPorMes[m] += t.valor_pago || 0
  }

  for (const r of raffles || []) {
    const m = r.mes
    despesaPremiosPorMes[m] = r.premio_valor || 0
  }

  const receitaCotasAcum = []
  const receitaEmpAcum = []
  const receitaBilhetesAcum = []
  const despesaAcum = []
  let rc = 0, re = 0, rb = 0, d = 0
  for (let m = 1; m <= MESES; m++) {
    rc += receitaCotasPorMes[m]
    re += receitaEmpPorMes[m]
    rb += receitaBilhetesPorMes[m]
    d += despesaPremiosPorMes[m]
    receitaCotasAcum[m] = rc
    receitaEmpAcum[m] = re
    receitaBilhetesAcum[m] = rb
    despesaAcum[m] = d
  }

  const participacaoPorUserMes = {}
  for (let i = 1; i <= 12; i++) participacaoPorUserMes[i] = Array(MESES + 1).fill(0)

  for (const p of payments || []) {
    const uid = quotaIdToUserId[p.quota_id]
    const idx = participants.findIndex((x) => x.id === uid) + 1
    if (idx < 1) continue
    const tot = (p.valor_pago || 0) + (p.juro_aplicado || 0)
    participacaoPorUserMes[idx][p.mes_referencia] += tot
  }

  const participacaoAcumPorUser = {}
  for (let u = 1; u <= 12; u++) {
    participacaoAcumPorUser[u] = []
    let acc = 0
    for (let m = 1; m <= MESES; m++) {
      acc += participacaoPorUserMes[u][m]
      participacaoAcumPorUser[u][m] = acc
    }
  }

  const totalParticipacaoAcum = []
  for (let m = 1; m <= MESES; m++) {
    let s = 0
    for (let u = 1; u <= 12; u++) s += participacaoAcumPorUser[u][m]
    totalParticipacaoAcum[m] = s
  }

  const lucroAcum = []
  for (let m = 1; m <= MESES; m++) {
    const rec = receitaCotasAcum[m] + receitaEmpAcum[m] + receitaBilhetesAcum[m]
    lucroAcum[m] = rec - despesaAcum[m]
  }

  const previsaoUserMes = {}
  for (let u = 1; u <= 12; u++) {
    previsaoUserMes[u] = []
    for (let m = 1; m <= MESES; m++) {
      const part = participacaoAcumPorUser[u][m]
      const total = totalParticipacaoAcum[m]
      const lucro = lucroAcum[m]
      const share = total > 0 ? (part / total) * lucro : 0
      previsaoUserMes[u][m] = share
    }
  }

  const lucroTotal = lucroAcum[MESES]
  const partTotal = totalParticipacaoAcum[MESES]
  const shareFinal = {}
  for (let u = 1; u <= 12; u++) {
    const p = participacaoAcumPorUser[u][MESES]
    shareFinal[u] = partTotal > 0 ? (p / partTotal) * lucroTotal : 0
  }

  const outParticipants = path.join(PROJECT_ROOT, 'TABELA_PARTICIPANTES_SIMULACAO.md')
  const outPrevisao = path.join(PROJECT_ROOT, 'PREVISAO_LUCROS_SIMULACAO.md')
  const mesesNome = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  let md = `# Tabela dos 12 Participantes (Simulação)\n\n`
  md += `Ano de referência: **${ANO}**. Credenciais para login.\n\n`
  md += `| # | Nome | E-mail (login) | Senha |\n`
  md += `|---|------|----------------|-------|\n`
  participants.forEach((p, i) => {
    md += `| ${i + 1} | ${p.fullName} | \`${p.email}\` | \`${p.password}\` |\n`
  })
  md += `\n`
  fs.writeFileSync(outParticipants, md, 'utf8')
  console.log('Arquivo gerado: TABELA_PARTICIPANTES_SIMULACAO.md')

  let prev = `# Previsão de Lucros e Divisão (Simulação ${ANO})\n\n`
  prev += `## Resumo do ano\n\n`
  prev += `- **Receita cotas (valor + juros):** ${formatCurrency(receitaCotasAcum[MESES])}\n`
  prev += `- **Receita juros empréstimos:** ${formatCurrency(receitaEmpAcum[MESES])}\n`
  prev += `- **Receita bilhetes:** ${formatCurrency(receitaBilhetesAcum[MESES])}\n`
  prev += `- **Despesa prêmios:** ${formatCurrency(despesaAcum[MESES])}\n`
  prev += `- **Lucro total:** ${formatCurrency(lucroTotal)}\n\n`
  prev += `## Previsão mês a mês (acumulado até o mês) – valor a sacar na conclusão do ano\n\n`
  prev += `Cada célula = previsão acumulada do participante até aquele mês (proporcional às cotas pagas).\n\n`

  let header = `| Participante | `
  for (let m = 1; m <= MESES; m++) header += `${mesesNome[m]} | `
  header += `**Total final** |\n|`
  for (let m = 0; m <= MESES; m++) header += `---|`
  prev += header + `\n`

  for (let u = 1; u <= 12; u++) {
    const p = participants[u - 1]
    let row = `| ${p.fullName} | `
    for (let m = 1; m <= MESES; m++) row += `${formatCurrency(previsaoUserMes[u][m])} | `
    row += `**${formatCurrency(shareFinal[u])}** |\n`
    prev += row
  }

  prev += `\n## Totais por mês (receita / despesa / lucro acumulado)\n\n`
  prev += `| Mês | Receita cotas | Receita emp. | Receita bilhetes | Despesa prêmios | Lucro acum. |\n`
  prev += `|-----|---------------|--------------|------------------|-----------------|-------------|\n`
  for (let m = 1; m <= MESES; m++) {
    prev += `| ${mesesNome[m]} | ${formatCurrency(receitaCotasAcum[m])} | ${formatCurrency(receitaEmpAcum[m])} | ${formatCurrency(receitaBilhetesAcum[m])} | ${formatCurrency(despesaAcum[m])} | ${formatCurrency(lucroAcum[m])} |\n`
  }

  fs.writeFileSync(outPrevisao, prev, 'utf8')
  console.log('Arquivo gerado: PREVISAO_LUCROS_SIMULACAO.md')

  console.log('\nConcluído.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

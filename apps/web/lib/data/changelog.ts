/**
 * Histórico de atualizações do sistema
 * 
 * Cada entrada pode ter audience: 'all', 'admin' ou 'user'
 * - 'all': Visível para todos
 * - 'admin': Apenas para administradores
 * - 'user': Apenas para usuários regulares
 */

export interface ChangelogEntry {
  version: string
  date: string
  audience: 'all' | 'admin' | 'user'
  added?: string[]
  changed?: string[]
  fixed?: string[]
  security?: string[]
}

// Função auxiliar para ordenar versões (mais recentes primeiro)
function sortByVersion(a: ChangelogEntry, b: ChangelogEntry): number {
  // Primeiro ordena por versão (mais recente primeiro)
  const versionA = a.version.split('.').map(Number)
  const versionB = b.version.split('.').map(Number)
  
  for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
    const partA = versionA[i] || 0
    const partB = versionB[i] || 0
    if (partB !== partA) {
      return partB - partA // Ordem decrescente
    }
  }
  
  // Se versões são iguais, ordena por data (mais recente primeiro)
  // Assumindo formato "DD de Mês de AAAA"
  const dateA = parseDate(a.date)
  const dateB = parseDate(b.date)
  return dateB.getTime() - dateA.getTime()
}

function parseDate(dateStr: string): Date {
  const months: Record<string, number> = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  }
  
  const parts = dateStr.toLowerCase().split(' de ')
  const day = parseInt(parts[0])
  const month = months[parts[1]] || 0
  const year = parseInt(parts[2])
  
  return new Date(year, month, day)
}

const rawChangelogData: ChangelogEntry[] = [
  {
    version: '1.0.3',
    date: '21 de Janeiro de 2026',
    audience: 'all',
    fixed: [
      'Corrigido erro de hidratação causado por extensões do navegador',
    ],
    changed: [
      'Melhorada a visualização do histórico de escolhas no painel administrativo',
    ],
  },
  {
    version: '1.0.3',
    date: '21 de Janeiro de 2026',
    audience: 'admin',
    added: [
      'Histórico de escolhas de sorteios agrupado por usuário',
      'Visualização completa de números escolhidos com informações detalhadas (nome, email, status, valores)',
      'Destaque visual para números ganhadores e reservas expiradas',
      'Estatísticas resumidas por usuário (total de números, confirmados, reservados, valor total)',
    ],
  },
  {
    version: '1.0.0',
    date: '19 de Janeiro de 2026',
    audience: 'all',
    added: [
      'Sistema inicial de caixinha para funcionários',
      'Autenticação e autorização de usuários (admin, cotista, não-cotista)',
      'Gestão de cotas (cadastro, pagamentos, histórico)',
      'Sistema de empréstimos baseado em cotas pagas',
      'Sorteios mensais com números de 1 a 100',
      'Sistema de versionamento semântico (SemVer)',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '1.0.0',
    date: '19 de Janeiro de 2026',
    audience: 'admin',
    added: [
      'Painel administrativo completo integrado ao dashboard',
      'Dashboard com estatísticas (total de usuários, cotistas, arrecadado, empréstimos)',
      'Gestão de usuários (visualizar e alterar roles)',
      'Confirmação de pagamentos pendentes',
      'Aprovação de solicitações de empréstimo',
      'Gerenciamento de sorteios mensais',
      'Configurações do sistema (juros, valores, limites)',
      'Restrições: administradores não podem comprar cotas, solicitar empréstimos ou participar de sorteios',
    ],
  },
  {
    version: '1.0.0',
    date: '19 de Janeiro de 2026',
    audience: 'user',
    added: [
      'Dashboard personalizado com informações de cotas, empréstimos e sorteios',
      'Cadastro e gestão de cotas mensais',
      'Histórico de pagamentos de cotas',
      'Solicitação de empréstimos baseados em cotas pagas',
      'Participação em sorteios mensais (reservar números de 1 a 100)',
      'Upload de comprovantes de pagamento',
      'Acompanhamento de status de pagamentos e empréstimos',
    ],
  },
]

// Ordenar por versão (mais recentes primeiro) e depois por data
export const changelogData: ChangelogEntry[] = rawChangelogData.sort(sortByVersion)

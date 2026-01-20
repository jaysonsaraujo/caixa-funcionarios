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

export const changelogData: ChangelogEntry[] = [
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

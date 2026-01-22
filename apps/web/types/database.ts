export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'cotista' | 'nao_cotista'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'cotista' | 'nao_cotista'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'cotista' | 'nao_cotista'
          created_at?: string
          updated_at?: string
        }
      }
      quotas: {
        Row: {
          id: string
          user_id: string
          num_cotas: number
          valor_por_cota: number
          data_cadastro: string
          status: 'ativa' | 'inativa'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          num_cotas: number
          valor_por_cota: number
          data_cadastro?: string
          status?: 'ativa' | 'inativa'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          num_cotas?: number
          valor_por_cota?: number
          data_cadastro?: string
          status?: 'ativa' | 'inativa'
          created_at?: string
          updated_at?: string
        }
      }
      quota_payments: {
        Row: {
          id: string
          quota_id: string
          mes_referencia: number
          ano_referencia: number
          valor_pago: number
          data_vencimento: string
          data_pagamento: string | null
          juro_aplicado: number
          status: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
          forma_pagamento: 'PIX' | 'dinheiro'
          comprovante_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quota_id: string
          mes_referencia: number
          ano_referencia: number
          valor_pago: number
          data_vencimento: string
          data_pagamento?: string | null
          juro_aplicado?: number
          status?: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
          forma_pagamento: 'PIX' | 'dinheiro'
          comprovante_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quota_id?: string
          mes_referencia?: number
          ano_referencia?: number
          valor_pago?: number
          data_vencimento?: string
          data_pagamento?: string | null
          juro_aplicado?: number
          status?: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
          forma_pagamento?: 'PIX' | 'dinheiro'
          comprovante_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          user_id: string
          valor_solicitado: number
          valor_total_devolver: number
          data_solicitacao: string
          data_vencimento: string
          juro_aplicado: number
          status: 'pendente' | 'aprovado' | 'quitado' | 'atrasado'
          tipo: 'cotista' | 'nao_cotista'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          valor_solicitado: number
          valor_total_devolver: number
          data_solicitacao?: string
          data_vencimento: string
          juro_aplicado: number
          status?: 'pendente' | 'aprovado' | 'quitado' | 'atrasado'
          tipo: 'cotista' | 'nao_cotista'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          valor_solicitado?: number
          valor_total_devolver?: number
          data_solicitacao?: string
          data_vencimento?: string
          juro_aplicado?: number
          status?: 'pendente' | 'aprovado' | 'quitado' | 'atrasado'
          tipo?: 'cotista' | 'nao_cotista'
          created_at?: string
          updated_at?: string
        }
      }
      monthly_raffles: {
        Row: {
          id: string
          mes: number
          ano: number
          numero_sorteado: number | null
          resultado_loteria: string | null
          premio_valor: number
          status: 'aberto' | 'fechado' | 'sorteado'
          data_sorteio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mes: number
          ano: number
          numero_sorteado?: number | null
          resultado_loteria?: string | null
          premio_valor: number
          status?: 'aberto' | 'fechado' | 'sorteado'
          data_sorteio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mes?: number
          ano?: number
          numero_sorteado?: number | null
          resultado_loteria?: string | null
          premio_valor?: number
          status?: 'aberto' | 'fechado' | 'sorteado'
          data_sorteio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      raffle_tickets: {
        Row: {
          id: string
          raffle_id: string
          user_id: string
          numero_escolhido: number
          valor_pago: number
          data_reserva: string
          data_vencimento_reserva: string
          status: 'reservado' | 'confirmado' | 'liberado'
          pagamento_status: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
          forma_pagamento: 'PIX' | 'dinheiro' | null
          comprovante_url: string | null
          data_pagamento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          raffle_id: string
          user_id: string
          numero_escolhido: number
          valor_pago: number
          data_reserva?: string
          data_vencimento_reserva: string
          status?: 'reservado' | 'confirmado' | 'liberado'
          pagamento_status?: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
          forma_pagamento?: 'PIX' | 'dinheiro' | null
          comprovante_url?: string | null
          data_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          raffle_id?: string
          user_id?: string
          numero_escolhido?: number
          valor_pago?: number
          data_reserva?: string
          data_vencimento_reserva?: string
          status?: 'reservado' | 'confirmado' | 'liberado'
          pagamento_status?: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
          forma_pagamento?: 'PIX' | 'dinheiro' | null
          comprovante_url?: string | null
          data_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      system_config: {
        Row: {
          id: string
          juro_atraso_cota: number
          juro_emprestimo_cotista: number
          juro_emprestimo_nao_cotista: number
          valor_premio_sorteio: number
          valor_minimo_cota: number
          valor_bilhete_sorteio: number
          max_admins: number
          updated_at: string
        }
        Insert: {
          id?: string
          juro_atraso_cota: number
          juro_emprestimo_cotista: number
          juro_emprestimo_nao_cotista: number
          valor_premio_sorteio: number
          valor_minimo_cota: number
          valor_bilhete_sorteio: number
          max_admins?: number
          updated_at?: string
        }
        Update: {
          id?: string
          juro_atraso_cota?: number
          juro_emprestimo_cotista?: number
          juro_emprestimo_nao_cotista?: number
          valor_premio_sorteio?: number
          valor_minimo_cota?: number
          valor_bilhete_sorteio?: number
          max_admins?: number
          updated_at?: string
        }
      }
      admin_actions_log: {
        Row: {
          id: string
          admin_id: string
          acao: string
          tabela_afetada: string
          registro_id: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          admin_id: string
          acao: string
          tabela_afetada: string
          registro_id: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          admin_id?: string
          acao?: string
          tabela_afetada?: string
          registro_id?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          timestamp?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'cotista' | 'nao_cotista'
      quota_status: 'ativa' | 'inativa'
      payment_status: 'pendente' | 'pago' | 'atrasado' | 'aguardando_confirmacao'
      loan_status: 'pendente' | 'aprovado' | 'quitado' | 'atrasado'
      raffle_status: 'aberto' | 'fechado' | 'sorteado'
      ticket_status: 'reservado' | 'confirmado' | 'liberado'
      payment_method: 'PIX' | 'dinheiro'
    }
  }
}

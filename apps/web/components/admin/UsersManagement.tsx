'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'cotista' | 'nao_cotista'
  created_at: string
}

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false })

      if (data) {
        setUsers(data)
      }
      setLoading(false)
    }

    loadUsers()
  }, [supabase])

  const updateUserRole = async (userId: string, newRole: 'cotista' | 'nao_cotista') => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600 dark:text-gray-400">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {users.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
          Total de usuários: {users.length}
        </div>
      )}
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
              {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user.full_name || user.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {user.role === 'cotista' ? 'Cotista' : 'Não Cotista'} | Cadastrado em:{' '}
                {formatDate(user.created_at)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={user.role === 'cotista' ? 'default' : 'outline'}
              onClick={() => updateUserRole(user.id, 'cotista')}
              className={user.role === 'cotista' ? 'gradient-primary text-white border-0' : ''}
            >
              Cotista
            </Button>
            <Button
              size="sm"
              variant={user.role === 'nao_cotista' ? 'default' : 'outline'}
              onClick={() => updateUserRole(user.id, 'nao_cotista')}
              className={user.role === 'nao_cotista' ? 'gradient-primary text-white border-0' : ''}
            >
              Não Cotista
            </Button>
          </div>
        </div>
      ))}
      {users.length === 0 && !loading && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">Nenhum usuário encontrado</p>
      )}
    </div>
  )
}

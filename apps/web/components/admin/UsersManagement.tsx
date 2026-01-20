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
        .limit(10)

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
    return <div className="text-sm text-gray-600">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div>
            <p className="font-medium">{user.full_name || user.email}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500">
              {user.role === 'cotista' ? 'Cotista' : 'Não Cotista'} | Cadastrado em:{' '}
              {formatDate(user.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={user.role === 'cotista' ? 'default' : 'outline'}
              onClick={() => updateUserRole(user.id, 'cotista')}
            >
              Cotista
            </Button>
            <Button
              size="sm"
              variant={user.role === 'nao_cotista' ? 'default' : 'outline'}
              onClick={() => updateUserRole(user.id, 'nao_cotista')}
            >
              Não Cotista
            </Button>
          </div>
        </div>
      ))}
      {users.length === 0 && (
        <p className="text-sm text-gray-600">Nenhum usuário encontrado</p>
      )}
    </div>
  )
}

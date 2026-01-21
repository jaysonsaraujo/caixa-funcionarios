import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { getVersionSync } from '@/lib/utils/version'
import { changelogData } from '@/lib/data/changelog'
import { MarkVersionSeen } from '@/components/shared/MarkVersionSeen'

export default async function ChangelogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const userType = isAdmin ? 'admin' : 'user'
  const currentVersion = getVersionSync()

  // Filtrar changelog pelo tipo de usuário
  const userChangelog = changelogData.filter(
    (entry) => entry.audience === userType || entry.audience === 'all'
  )

  return (
    <div className="space-y-6">
      <MarkVersionSeen />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Histórico de Atualizações</h1>
        <p className="mt-2 text-sm text-gray-600">
          Versão atual: <span className="font-mono font-semibold">v{currentVersion}</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin
            ? 'Visualizando atualizações do painel administrativo'
            : 'Visualizando atualizações do sistema para usuários'}
        </p>
      </div>

      <div className="space-y-6">
        {userChangelog.map((entry, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Versão {entry.version}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>{entry.date}</span>
                    {entry.audience !== 'all' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {entry.audience === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {entry.added && entry.added.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-green-700 mb-2">✅ Adicionado</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    {entry.added.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.changed && entry.changed.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">🔄 Alterado</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    {entry.changed.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.fixed && entry.fixed.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-orange-700 mb-2">🔧 Corrigido</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    {entry.fixed.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.security && entry.security.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-red-700 mb-2">🔒 Segurança</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                    {entry.security.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {userChangelog.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Nenhuma atualização registrada ainda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

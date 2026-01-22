import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/shared/Button'
import { VersionBadge } from '@/components/shared/VersionBadge'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const navLinkClass =
    'inline-flex items-center rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all duration-200 px-1.5 py-1 text-xs sm:text-xs sm:px-2 sm:py-1.5 md:text-sm md:px-3 md:py-2'

  return (
    <div className="min-h-screen">
      <nav className="glass-effect dark:bg-gray-900/80 border-b border-white/20 dark:border-gray-700/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center min-h-16 py-2 gap-1">
            <div className="flex items-center gap-0 overflow-hidden">
              <div className="flex flex-shrink-0 items-center">
                <div className="flex items-center gap-0">
                  <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="sr-only">Sistema de Caixinha</span>
                </div>
              </div>
              <div className="hidden sm:flex sm:-ml-1 sm:items-center">
                <div className="flex items-center gap-0">
                <Link
                  href="/dashboard"
                  className={navLinkClass}
                >
                  Dashboard
                </Link>
                {isAdmin ? (
                  <>
                    <Link
                      href="/admin/usuarios"
                      className={navLinkClass}
                    >
                      Usuários
                    </Link>
                    <Link
                      href="/admin/pagamentos"
                      className={navLinkClass}
                    >
                      Pagamentos
                    </Link>
                    <Link
                      href="/admin/emprestimos"
                      className={navLinkClass}
                    >
                      Empréstimos
                    </Link>
                    <Link
                      href="/admin/sorteios"
                      className={navLinkClass}
                    >
                      Sorteios
                    </Link>
                    <Link
                      href="/admin/configuracoes"
                      className={navLinkClass}
                    >
                      Configurações
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/cotas"
                      className={navLinkClass}
                    >
                      Cotas
                    </Link>
                    <Link
                      href="/emprestimos"
                      className={navLinkClass}
                    >
                      Empréstimos
                    </Link>
                    <Link
                      href="/sorteios"
                      className={navLinkClass}
                    >
                      Sorteios
                    </Link>
                  </>
                )}
                </div>
              </div>
            </div>
            <div className="ml-auto flex flex-shrink-0 items-center gap-2 sm:gap-4">
              <VersionBadge />
              <div className="flex min-w-0 max-w-[11rem] items-center gap-2 rounded-lg bg-white/50 px-3 py-2 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 sm:max-w-[14rem] lg:max-w-none">
                <div className="h-8 w-8 flex-shrink-0 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                  {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                  {profile?.full_name || user.email}
                </span>
              </div>
              <form action="/api/auth/signout" method="post">
                <Button type="submit" variant="outline" size="sm" className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700">
                  Sair
                </Button>
              </form>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

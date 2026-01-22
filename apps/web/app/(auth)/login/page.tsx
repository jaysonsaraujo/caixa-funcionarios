'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Label } from '@/components/shared/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const cardClasses = isDark
    ? 'bg-gray-950/80 text-gray-100 border-white/10'
    : 'bg-white/95 text-gray-900 border-white/30'

  const titleClasses = isDark ? 'text-gray-100' : 'text-gray-900'
  const descriptionClasses = isDark ? 'text-gray-300' : 'text-gray-700'
  const labelClasses = isDark ? 'text-gray-200' : 'text-gray-900'
  const footerClasses = isDark ? 'text-gray-300' : 'text-gray-700'
  const backgroundImage = isDark ? '/login-dark-bg.png' : '/login-light-bg.png'
  const backgroundOverlayClasses = isDark ? 'bg-black/50' : 'bg-white/35'
  const inputClasses = isDark
    ? 'transition-all focus:ring-2 focus:ring-primary bg-gray-900/90 text-gray-100 placeholder:text-gray-400'
    : 'transition-all focus:ring-2 focus:ring-primary bg-white/90 text-gray-900 placeholder:text-gray-500'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className={`absolute inset-0 ${backgroundOverlayClasses}`} />
      </div>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="bg-white/90 text-gray-900 border-white/60 shadow-sm hover:bg-white dark:bg-gray-900/80 dark:text-gray-100 dark:border-white/20" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-primary mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Sistema de Caixinha
          </h1>
        </div>
        <Card
          variant="elevated"
          className={`w-full backdrop-blur-md border ${cardClasses}`}
        >
          <CardHeader>
            <CardTitle className={titleClasses}>Login</CardTitle>
            <CardDescription className={descriptionClasses}>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-200 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className={labelClasses}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className={labelClasses}>Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-white border-0 hover:opacity-90" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <div className={`mt-4 text-center text-sm ${footerClasses}`}>
              Não tem uma conta?{' '}
              <Link href="/signup" className="text-primary dark:text-primary hover:underline font-medium">
                Cadastre-se
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

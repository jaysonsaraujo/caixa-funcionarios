import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  // Valores padrão para desenvolvimento local
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ubklczzcuoaqquqxwnqd.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia2xjenpjdW9hcXF1cXh3bnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzMyNDksImV4cCI6MjA4NDQ0OTI0OX0.Za7soPn0NAUMlFUSpU4L4rlZF-0XRnMegwHg_6BK-JQ'

  if (!url || !key) {
    throw new Error(
      'Supabase URL e Key não configuradas. Verifique se o arquivo .env.local existe e reinicie o servidor Next.js.'
    )
  }

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

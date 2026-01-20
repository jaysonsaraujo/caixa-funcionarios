import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Valores padrão para desenvolvimento local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ubklczzcuoaqquqxwnqd.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia2xjenpjdW9hcXF1cXh3bnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzMyNDksImV4cCI6MjA4NDQ0OTI0OX0.Za7soPn0NAUMlFUSpU4L4rlZF-0XRnMegwHg_6BK-JQ'

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase URL e Key não configuradas. Verifique se o arquivo .env.local existe e reinicie o servidor Next.js.'
    )
  }

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}

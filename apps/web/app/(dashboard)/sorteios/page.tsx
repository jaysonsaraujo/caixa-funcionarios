import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import { formatCurrency } from '@/lib/utils'
import { RaffleNumbersGrid } from '@/components/sorteios/RaffleNumbersGrid'
import { MyTicketsList } from '@/components/sorteios/MyTicketsList'

export default async function SorteiosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()

  // Buscar sorteio do mês atual
  let { data: currentRaffle } = await supabase
    .from('monthly_raffles')
    .select('*')
    .eq('mes', mesAtual)
    .eq('ano', anoAtual)
    .single()

  // Se não existe, criar (apenas admin pode fazer isso via painel)
  if (!currentRaffle) {
    // Aqui normalmente seria criado pelo admin, mas para facilitar vamos criar se não existir
    const { data: systemConfig } = await supabase
      .from('system_config')
      .select('*')
      .single()

    const { data: newRaffle } = await supabase
      .from('monthly_raffles')
      .insert({
        mes: mesAtual,
        ano: anoAtual,
        premio_valor: systemConfig?.valor_premio_sorteio || 1000,
        status: 'aberto',
      })
      .select()
      .single()

    currentRaffle = newRaffle
  }

  // Buscar números já escolhidos
  const { data: takenNumbers } = currentRaffle
    ? await supabase
        .from('raffle_tickets')
        .select('numero_escolhido, status, user_id')
        .eq('raffle_id', currentRaffle.id)
        .in('status', ['confirmado', 'reservado'])
    : null

  // Buscar meus números
  const { data: myTickets } = currentRaffle
    ? await supabase
        .from('raffle_tickets')
        .select('*')
        .eq('raffle_id', currentRaffle.id)
        .eq('user_id', user.id)
        .order('numero_escolhido', { ascending: true })
    : null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const { data: systemConfig } = await supabase
    .from('system_config')
    .select('*')
    .single()

  const valorBilhete = systemConfig?.valor_bilhete_sorteio || 10

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sorteios</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Participe do sorteio mensal e concorra ao prêmio
        </p>
      </div>

      {isAdmin && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Administradores não podem participar de sorteios</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Como administrador, você não pode participar de sorteios. Esta funcionalidade é exclusiva para usuários regulares (cotistas e não cotistas).
            </p>
          </CardContent>
        </Card>
      )}

      {!isAdmin && (
        <>
          {currentRaffle && (
            <Card variant="gradient" className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">
                      Sorteio de {new Date(currentRaffle.ano, currentRaffle.mes - 1).toLocaleString('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Prêmio: {formatCurrency(currentRaffle.premio_valor)} | Valor por número:{' '}
                      {formatCurrency(valorBilhete)}
                    </CardDescription>
                  </div>
                  <div className="rounded-lg p-3 bg-white/20">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentRaffle.status === 'aberto' ? (
                  <RaffleNumbersGrid
                    raffleId={currentRaffle.id}
                    valorBilhete={valorBilhete}
                    takenNumbers={takenNumbers || []}
                    currentUserId={user.id}
                  />
                ) : (
                  <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg text-center">
                    <p className="text-lg font-medium text-white">
                      {currentRaffle.status === 'sorteado' ? 'Sorteio realizado!' : 'Sorteio fechado'}
                    </p>
                    {currentRaffle.numero_sorteado && (
                      <p className="text-3xl font-bold mt-3 text-white">Número sorteado: {currentRaffle.numero_sorteado}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {myTickets && myTickets.length > 0 && (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Meus Números</CardTitle>
                <CardDescription>Números que você escolheu neste sorteio</CardDescription>
              </CardHeader>
              <CardContent>
                <MyTicketsList tickets={myTickets} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

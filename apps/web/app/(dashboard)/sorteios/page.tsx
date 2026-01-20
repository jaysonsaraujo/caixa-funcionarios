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
        .eq('status', 'confirmado')
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
        <h1 className="text-3xl font-bold text-gray-900">Sorteios</h1>
        <p className="mt-2 text-sm text-gray-600">
          Participe do sorteio mensal e concorra ao prêmio
        </p>
      </div>

      {isAdmin && (
        <Card>
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
            <Card>
              <CardHeader>
                <CardTitle>
                  Sorteio de {new Date(currentRaffle.ano, currentRaffle.mes - 1).toLocaleString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </CardTitle>
                <CardDescription>
                  Prêmio: {formatCurrency(currentRaffle.premio_valor)} | Valor por número:{' '}
                  {formatCurrency(valorBilhete)}
                </CardDescription>
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
                  <div className="p-4 bg-gray-50 rounded-md text-center">
                    <p className="text-lg font-medium">
                      {currentRaffle.status === 'sorteado' ? 'Sorteio realizado!' : 'Sorteio fechado'}
                    </p>
                    {currentRaffle.numero_sorteado && (
                      <p className="text-2xl font-bold mt-2">Número sorteado: {currentRaffle.numero_sorteado}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {myTickets && myTickets.length > 0 && (
            <Card>
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

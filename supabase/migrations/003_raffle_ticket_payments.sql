-- Add payment tracking fields for raffle tickets
ALTER TABLE public.raffle_tickets
  ADD COLUMN pagamento_status payment_status NOT NULL DEFAULT 'pendente',
  ADD COLUMN forma_pagamento payment_method,
  ADD COLUMN comprovante_url TEXT,
  ADD COLUMN data_pagamento DATE;

CREATE INDEX IF NOT EXISTS idx_raffle_tickets_pagamento_status
  ON public.raffle_tickets(pagamento_status);

UPDATE public.raffle_tickets
SET pagamento_status = 'pago',
    data_pagamento = COALESCE(data_pagamento, data_reserva::date)
WHERE status = 'confirmado' AND pagamento_status = 'pendente';

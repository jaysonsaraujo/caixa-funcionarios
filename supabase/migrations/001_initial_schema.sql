-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'cotista', 'nao_cotista');
CREATE TYPE quota_status AS ENUM ('ativa', 'inativa');
CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'atrasado', 'aguardando_confirmacao');
CREATE TYPE loan_status AS ENUM ('pendente', 'aprovado', 'quitado', 'atrasado');
CREATE TYPE raffle_status AS ENUM ('aberto', 'fechado', 'sorteado');
CREATE TYPE ticket_status AS ENUM ('reservado', 'confirmado', 'liberado');
CREATE TYPE payment_method AS ENUM ('PIX', 'dinheiro');

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'nao_cotista',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System configuration
CREATE TABLE public.system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    juro_atraso_cota DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    juro_emprestimo_cotista DECIMAL(5,2) NOT NULL DEFAULT 3.00,
    juro_emprestimo_nao_cotista DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    valor_premio_sorteio DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    valor_minimo_cota DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    valor_bilhete_sorteio DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    max_admins INTEGER NOT NULL DEFAULT 4,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default system config
INSERT INTO public.system_config (id) VALUES (uuid_generate_v4());

-- Quotas table
CREATE TABLE public.quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    num_cotas INTEGER NOT NULL CHECK (num_cotas > 0),
    valor_por_cota DECIMAL(10,2) NOT NULL CHECK (valor_por_cota >= 50.00),
    data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE,
    status quota_status NOT NULL DEFAULT 'ativa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Quota payments table
CREATE TABLE public.quota_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quota_id UUID NOT NULL REFERENCES public.quotas(id) ON DELETE CASCADE,
    mes_referencia INTEGER NOT NULL CHECK (mes_referencia >= 1 AND mes_referencia <= 12),
    ano_referencia INTEGER NOT NULL,
    valor_pago DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    juro_aplicado DECIMAL(10,2) NOT NULL DEFAULT 0,
    status payment_status NOT NULL DEFAULT 'pendente',
    forma_pagamento payment_method NOT NULL,
    comprovante_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loans table
CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    valor_solicitado DECIMAL(10,2) NOT NULL CHECK (valor_solicitado > 0),
    valor_total_devolver DECIMAL(10,2) NOT NULL CHECK (valor_total_devolver > 0),
    data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    juro_aplicado DECIMAL(5,2) NOT NULL,
    status loan_status NOT NULL DEFAULT 'pendente',
    tipo user_role NOT NULL CHECK (tipo IN ('cotista', 'nao_cotista')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly raffles table
CREATE TABLE public.monthly_raffles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ano INTEGER NOT NULL,
    numero_sorteado INTEGER CHECK (numero_sorteado >= 1 AND numero_sorteado <= 100),
    resultado_loteria TEXT,
    premio_valor DECIMAL(10,2) NOT NULL,
    status raffle_status NOT NULL DEFAULT 'aberto',
    data_sorteio DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(mes, ano)
);

-- Raffle tickets table
CREATE TABLE public.raffle_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID NOT NULL REFERENCES public.monthly_raffles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    numero_escolhido INTEGER NOT NULL CHECK (numero_escolhido >= 1 AND numero_escolhido <= 100),
    valor_pago DECIMAL(10,2) NOT NULL,
    data_reserva TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_vencimento_reserva TIMESTAMPTZ NOT NULL,
    status ticket_status NOT NULL DEFAULT 'reservado',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(raffle_id, numero_escolhido)
);

-- Admin actions log table
CREATE TABLE public.admin_actions_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    acao TEXT NOT NULL,
    tabela_afetada TEXT NOT NULL,
    registro_id TEXT NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_quotas_user_id ON public.quotas(user_id);
CREATE INDEX idx_quota_payments_quota_id ON public.quota_payments(quota_id);
CREATE INDEX idx_quota_payments_status ON public.quota_payments(status);
CREATE INDEX idx_loans_user_id ON public.loans(user_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_raffle_tickets_raffle_id ON public.raffle_tickets(raffle_id);
CREATE INDEX idx_raffle_tickets_user_id ON public.raffle_tickets(user_id);
CREATE INDEX idx_raffle_tickets_status ON public.raffle_tickets(status);
CREATE INDEX idx_admin_actions_log_admin_id ON public.admin_actions_log(admin_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotas_updated_at BEFORE UPDATE ON public.quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quota_payments_updated_at BEFORE UPDATE ON public.quota_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_raffles_updated_at BEFORE UPDATE ON public.monthly_raffles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raffle_tickets_updated_at BEFORE UPDATE ON public.raffle_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON public.system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        'nao_cotista'::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
DECLARE
    admin_role user_role;
BEGIN
    SELECT role INTO admin_role
    FROM public.users
    WHERE id = auth.uid();
    
    IF admin_role = 'admin' THEN
        IF TG_OP = 'UPDATE' THEN
            INSERT INTO public.admin_actions_log (admin_id, acao, tabela_afetada, registro_id, dados_anteriores, dados_novos)
            VALUES (
                auth.uid(),
                TG_OP,
                TG_TABLE_NAME,
                COALESCE(NEW.id::text, OLD.id::text),
                row_to_json(OLD),
                row_to_json(NEW)
            );
            RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
            INSERT INTO public.admin_actions_log (admin_id, acao, tabela_afetada, registro_id, dados_novos)
            VALUES (
                auth.uid(),
                TG_OP,
                TG_TABLE_NAME,
                NEW.id::text,
                row_to_json(NEW)
            );
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO public.admin_actions_log (admin_id, acao, tabela_afetada, registro_id, dados_anteriores)
            VALUES (
                auth.uid(),
                TG_OP,
                TG_TABLE_NAME,
                OLD.id::text,
                row_to_json(OLD)
            );
            RETURN OLD;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

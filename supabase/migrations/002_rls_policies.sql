-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is not admin
CREATE OR REPLACE FUNCTION public.is_not_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = target_user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all non-admin users"
    ON public.users FOR SELECT
    USING (public.is_admin() AND public.is_not_admin(id));

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update non-admin users"
    ON public.users FOR UPDATE
    USING (public.is_admin() AND public.is_not_admin(id))
    WITH CHECK (public.is_admin() AND public.is_not_admin(id));

-- System config policies
CREATE POLICY "Everyone can view system config"
    ON public.system_config FOR SELECT
    USING (true);

CREATE POLICY "Only admins can update system config"
    ON public.system_config FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Quotas policies
CREATE POLICY "Users can view their own quotas"
    ON public.quotas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quotas except admin quotas"
    ON public.quotas FOR SELECT
    USING (public.is_admin() AND public.is_not_admin(user_id));

CREATE POLICY "Users can insert their own quotas"
    ON public.quotas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas"
    ON public.quotas FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update non-admin quotas"
    ON public.quotas FOR UPDATE
    USING (public.is_admin() AND public.is_not_admin(user_id))
    WITH CHECK (public.is_admin() AND public.is_not_admin(user_id));

-- Quota payments policies
CREATE POLICY "Users can view their own quota payments"
    ON public.quota_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quotas
            WHERE quotas.id = quota_payments.quota_id
            AND quotas.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all quota payments except admin payments"
    ON public.quota_payments FOR SELECT
    USING (
        public.is_admin() AND
        EXISTS (
            SELECT 1 FROM public.quotas
            WHERE quotas.id = quota_payments.quota_id
            AND public.is_not_admin(quotas.user_id)
        )
    );

CREATE POLICY "Users can insert their own quota payments"
    ON public.quota_payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quotas
            WHERE quotas.id = quota_payments.quota_id
            AND quotas.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own quota payments"
    ON public.quota_payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.quotas
            WHERE quotas.id = quota_payments.quota_id
            AND quotas.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quotas
            WHERE quotas.id = quota_payments.quota_id
            AND quotas.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update non-admin quota payments"
    ON public.quota_payments FOR UPDATE
    USING (
        public.is_admin() AND
        EXISTS (
            SELECT 1 FROM public.quotas
            WHERE quotas.id = quota_payments.quota_id
            AND public.is_not_admin(quotas.user_id)
        )
    )
    WITH CHECK (
        public.is_admin() AND
        EXISTS (
            SELECT 1 FROM public.quotas
            WHERE quotas.id = quota_payments.quota_id
            AND public.is_not_admin(quotas.user_id)
        )
    );

-- Loans policies
CREATE POLICY "Users can view their own loans"
    ON public.loans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loans except admin loans"
    ON public.loans FOR SELECT
    USING (public.is_admin() AND public.is_not_admin(user_id));

CREATE POLICY "Users can insert their own loans"
    ON public.loans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
    ON public.loans FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update non-admin loans"
    ON public.loans FOR UPDATE
    USING (public.is_admin() AND public.is_not_admin(user_id))
    WITH CHECK (public.is_admin() AND public.is_not_admin(user_id));

-- Monthly raffles policies
CREATE POLICY "Everyone can view monthly raffles"
    ON public.monthly_raffles FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert monthly raffles"
    ON public.monthly_raffles FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update monthly raffles"
    ON public.monthly_raffles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Raffle tickets policies
CREATE POLICY "Users can view their own raffle tickets"
    ON public.raffle_tickets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all raffle tickets"
    ON public.raffle_tickets FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can insert their own raffle tickets"
    ON public.raffle_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own raffle tickets"
    ON public.raffle_tickets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all raffle tickets"
    ON public.raffle_tickets FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admin actions log policies
CREATE POLICY "Only admins can view admin actions log"
    ON public.admin_actions_log FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Only admins can insert admin actions log"
    ON public.admin_actions_log FOR INSERT
    WITH CHECK (public.is_admin());

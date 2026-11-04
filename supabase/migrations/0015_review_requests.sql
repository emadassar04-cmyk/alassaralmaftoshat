-- Remember when staff asked a customer (via WhatsApp) to review a received order.
alter table public.orders add column review_requested_at timestamptz;

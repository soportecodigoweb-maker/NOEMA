-- Notificaciones push reales: guarda los tokens de cada dispositivo y, cuando se
-- crea una notificación, la envía como push vía el servicio de Expo (usa pg_net).

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  plataforma text,
  actualizado_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

drop policy if exists push_tokens_propio on public.push_tokens;
create policy push_tokens_propio on public.push_tokens
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Envía un push por cada token del destinatario cuando se inserta una notificación.
create or replace function public.enviar_push_notificacion()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  t record;
begin
  for t in select token from public.push_tokens where user_id = new.destinatario_id loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'to', t.token,
        'title', new.titulo,
        'body', new.cuerpo,
        'sound', 'default',
        'data', jsonb_build_object('url', new.url)
      )
    );
  end loop;
  return new;
end $function$;

drop trigger if exists trg_push_notificacion on public.notificaciones;
create trigger trg_push_notificacion
  after insert on public.notificaciones
  for each row execute function public.enviar_push_notificacion();

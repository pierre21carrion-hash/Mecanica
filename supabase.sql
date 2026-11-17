-- Pega TODO este archivo en Supabase > SQL Editor > Run

create table profiles(
  id uuid primary key references auth.users on delete cascade,
  full_name text, phone text,
  role text not null default 'client' check (role in ('client','staff','admin')),
  created_at timestamptz default now());

create table services(
  id text primary key,
  branch text not null check (branch in ('det','mec')),
  name text not null, price numeric not null default 0, active boolean not null default true);

create table orders(
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  user_id uuid not null references profiles(id),
  branch text not null check (branch in ('emer','det','mec')),
  service text references services(id),
  details jsonb not null default '{}',
  address text not null, lat numeric, lng numeric,
  scheduled_at timestamptz, price numeric,
  status text not null default 'nuevo' check (status in ('nuevo','confirmado','en_camino','en_proceso','completado','cancelado')),
  created_at timestamptz default now());

-- un solo pedido por horario (1 equipo). Evita citas dobles aunque dos clientes reserven a la vez
create unique index one_per_slot on orders(scheduled_at) where scheduled_at is not null and status <> 'cancelado';

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,full_name,phone) values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'phone'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function my_role() returns text language sql security definer stable set search_path=public as $$ select role from profiles where id=auth.uid() $$;
create function taken_slots(a timestamptz,b timestamptz) returns setof timestamptz language sql security definer stable set search_path=public as $$
  select scheduled_at from orders where scheduled_at>=a and scheduled_at<b and status<>'cancelado' $$;

alter table profiles enable row level security;
alter table services enable row level security;
alter table orders enable row level security;

create policy p_sel on profiles for select using (id=auth.uid() or my_role() in ('staff','admin'));
create policy p_upd on profiles for update using (id=auth.uid()) with check (id=auth.uid() and role=my_role());

create policy s_sel on services for select using (true);
create policy s_all on services for all using (my_role() in ('staff','admin')) with check (my_role() in ('staff','admin'));

create policy o_sel on orders for select using (user_id=auth.uid() or my_role() in ('staff','admin'));
create policy o_ins on orders for insert with check (user_id=auth.uid() and status='nuevo');
create policy o_upd on orders for update using (my_role() in ('staff','admin'));
create policy o_cancel on orders for update using (user_id=auth.uid() and status='nuevo') with check (user_id=auth.uid() and status='cancelado');

alter publication supabase_realtime add table orders;

insert into services values
('det_basico','det','Lavado básico exterior',25,true),
('det_completo','det','Lavado completo + aspirado',45,true),
('det_interior','det','Limpieza interior profunda',35,true),
('det_pulido','det','Pulido y abrillantado',80,true),
('det_ceramico','det','Recubrimiento cerámico',150,true),
('mec_diag','mec','Diagnóstico computarizado',20,true),
('mec_aceite','mec','Cambio de aceite y filtro',35,true),
('mec_frenos','mec','Frenos (revisión o cambio)',60,true),
('mec_bateria','mec','Batería y sistema de carga',40,true),
('mec_general','mec','Revisión general',30,true),
('mec_otro','mec','Otro (se cotiza en sitio)',0,true);

-- DESPUÉS de crear tu cuenta en la página, vuélvete administrador (cambia el correo):
-- update profiles set role='admin' where id=(select id from auth.users where email='TU_CORREO');

-- MAMUTE – Gestão de Frotas: schema inicial
create extension if not exists pgcrypto;

-- ============ PERFIS DE USUÁRIO ============
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  perfil text not null default 'operador' check (perfil in ('admin','operador')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ CADASTROS ============
create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  prefixo text unique not null,
  nome_bem text,
  familia text,
  modelo text,
  marca text,
  ano_fabricacao int,
  ano_modelo int,
  chassi text,
  numero_motor text,
  cor text,
  tipo_combustivel text,
  centro_custo text,
  peso_total_bruto numeric(12,2),
  seguro text,
  rastreador text,
  status text not null default 'ativo' check (status in ('ativo','manutencao','mobilizado','desmobilizado','baixado')),
  placa text unique,
  renavam text,
  uf_emplacamento char(2),
  fornecedor text,
  valor_compra numeric(14,2),
  numero_nf_compra text,
  km_atual int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pneus (
  id uuid primary key default gen_random_uuid(),
  marca text not null,
  modelo text not null,
  aplicacao text,
  desenho text,
  construcao text,
  tipo text,
  aro text,
  medida text not null,
  profundidade_sulco numeric(5,2),
  fogo text,
  dot text,
  status text not null default 'novo' check (status in ('novo','em_uso','recapado','sucateado','baixado')),
  fornecedor text,
  numero_nf text,
  valor_compra numeric(14,2),
  lonagem text,
  indice_carga_simples text,
  indice_carga_duplo text,
  veiculo_id uuid references public.veiculos(id) on delete set null,
  posicao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  descricao text not null,
  categoria text,
  unidade text not null default 'un',
  estoque_atual numeric(14,3) not null default 0,
  estoque_minimo numeric(14,3) not null default 0,
  valor_unitario numeric(14,2),
  fornecedor text,
  created_at timestamptz not null default now()
);

-- ============ PNEUS: VISTORIA E PARECER ============
create table if not exists public.vistorias_pneu (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  veiculo_id uuid references public.veiculos(id) on delete cascade,
  pneu_id uuid references public.pneus(id) on delete cascade,
  posicao text,
  km int,
  sulco_mm numeric(5,2),
  condicao text not null default 'boa' check (condicao in ('boa','atencao','critica')),
  observacoes text,
  fotos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pareceres_pneu (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  data date not null default current_date,
  vistoria_id uuid references public.vistorias_pneu(id) on delete set null,
  veiculo_id uuid references public.veiculos(id) on delete set null,
  pneu_id uuid references public.pneus(id) on delete set null,
  -- snapshot dos dados no momento da emissão
  veiculo_placa text,
  veiculo_marca text,
  veiculo_modelo text,
  veiculo_ano int,
  veiculo_segmento text,
  veiculo_km int,
  pneu_marca text,
  pneu_modelo text,
  pneu_medida text,
  pneu_fogo text,
  pneu_dot text,
  pneu_status text,
  tipo_avaria text,
  area_pneu text,
  provavel_causa text,
  fonte_tecnica text,
  analise_tecnica text,
  conclusao_tecnica text,
  parecer_final text check (parecer_final in ('garantia_fabricacao','dano_acidental','falha_operacional','desgaste_natural','falha_manutencao','necessita_investigacao','improcedente')),
  decisao_perda text check (decisao_perda in ('aprovado','nao_aprovado','arquivar')),
  fotos jsonb not null default '{}'::jsonb,
  status text not null default 'rascunho' check (status in ('rascunho','emitido')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ MANUTENÇÃO CORRETIVA ============
create table if not exists public.manutencoes_corretivas (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  veiculo_id uuid not null references public.veiculos(id) on delete cascade,
  data_abertura date not null default current_date,
  km int,
  sistema text,
  descricao_defeito text not null,
  oficina text,
  data_inicio date,
  data_conclusao date,
  status text not null default 'aberta' check (status in ('aberta','em_andamento','concluida','cancelada')),
  custo_pecas numeric(14,2) not null default 0,
  custo_servicos numeric(14,2) not null default 0,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ============ MANUTENÇÃO PREVENTIVA ============
create table if not exists public.planos_preventiva (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  intervalo_km int,
  intervalo_dias int,
  created_at timestamptz not null default now(),
  check (intervalo_km is not null or intervalo_dias is not null)
);

create table if not exists public.manutencoes_preventivas (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos(id) on delete cascade,
  plano_id uuid not null references public.planos_preventiva(id) on delete cascade,
  data_realizada date not null default current_date,
  km_realizado int,
  proxima_data date,
  proxima_km int,
  oficina text,
  custo numeric(14,2) not null default 0,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ============ MOBILIZAÇÃO / DESMOBILIZAÇÃO ============
create table if not exists public.mobilizacoes (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos(id) on delete cascade,
  tipo text not null check (tipo in ('mobilizacao','desmobilizacao')),
  data date not null default current_date,
  km int,
  origem text,
  destino text,
  centro_custo text,
  responsavel text,
  motivo text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ============ COMBUSTÍVEL ============
create table if not exists public.abastecimentos (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos(id) on delete cascade,
  data date not null default current_date,
  km int not null,
  tipo_combustivel text,
  litros numeric(12,2) not null check (litros > 0),
  valor_litro numeric(10,3) not null check (valor_litro >= 0),
  valor_total numeric(14,2) generated always as (round(litros * valor_litro, 2)) stored,
  posto text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ============ ÍNDICES ============
create index if not exists idx_pneus_veiculo on public.pneus(veiculo_id);
create index if not exists idx_vist_veiculo on public.vistorias_pneu(veiculo_id);
create index if not exists idx_pareceres_veiculo on public.pareceres_pneu(veiculo_id);
create index if not exists idx_corretivas_veiculo on public.manutencoes_corretivas(veiculo_id);
create index if not exists idx_preventivas_veiculo on public.manutencoes_preventivas(veiculo_id, plano_id);
create index if not exists idx_mob_veiculo on public.mobilizacoes(veiculo_id);
create index if not exists idx_abast_veiculo on public.abastecimentos(veiculo_id, km);

-- ============ SEGURANÇA (RLS) ============
alter table public.perfis enable row level security;
alter table public.veiculos enable row level security;
alter table public.pneus enable row level security;
alter table public.produtos enable row level security;
alter table public.vistorias_pneu enable row level security;
alter table public.pareceres_pneu enable row level security;
alter table public.manutencoes_corretivas enable row level security;
alter table public.planos_preventiva enable row level security;
alter table public.manutencoes_preventivas enable row level security;
alter table public.mobilizacoes enable row level security;
alter table public.abastecimentos enable row level security;

-- Perfis: cada usuário lê/edita o próprio; admins leem e editam todos
create policy "perfis_select" on public.perfis for select to authenticated
  using (id = auth.uid() or exists (select 1 from public.perfis p where p.id = auth.uid() and p.perfil = 'admin'));
create policy "perfis_update" on public.perfis for update to authenticated
  using (id = auth.uid() or exists (select 1 from public.perfis p where p.id = auth.uid() and p.perfil = 'admin'))
  with check (id = auth.uid() or exists (select 1 from public.perfis p where p.id = auth.uid() and p.perfil = 'admin'));

-- Demais tabelas: usuários autenticados têm acesso total (premissa: frota com equipe interna confiável)
do $$
declare t text;
begin
  foreach t in array array['veiculos','pneus','produtos','vistorias_pneu','pareceres_pneu',
    'manutencoes_corretivas','planos_preventiva','manutencoes_preventivas','mobilizacoes','abastecimentos']
  loop
    execute format('create policy "%s_all" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ============ STORAGE: fotos de vistoria (bucket privado) ============
insert into storage.buckets (id, name, public) values ('vistorias', 'vistorias', false)
on conflict (id) do nothing;

create policy "vistorias_storage_all" on storage.objects for all to authenticated
  using (bucket_id = 'vistorias') with check (bucket_id = 'vistorias');

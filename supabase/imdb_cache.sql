create table if not exists public.imdb_cache (
  movie_id text primary key,
  imdb_rating text,
  updated_at timestamptz not null default now()
);

create index if not exists imdb_cache_updated_at_idx on public.imdb_cache (updated_at);

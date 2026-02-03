insert into public.imdb_cache (movie_id, imdb_rating, updated_at)
values

on conflict (movie_id) do update set
  imdb_rating = excluded.imdb_rating,
  updated_at = excluded.updated_at;


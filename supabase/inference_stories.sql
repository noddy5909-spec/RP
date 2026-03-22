-- inference_stories: 대화 요약(공유) — Supabase SQL Editor 에서 실행

create table if not exists public.inference_stories (
  id uuid primary key default gen_random_uuid(),
  passage_title text not null,
  step1 text default '',
  step2 text default '',
  step3 text default '',
  created_at timestamptz not null default now()
);

comment on table public.inference_stories is '독서 대화 요약(Step1~3) 공유 기록';

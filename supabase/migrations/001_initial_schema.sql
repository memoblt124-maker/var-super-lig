-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── TEAMS ───────────────────────────────────────────────────────────────────
create table teams (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  short_name        text,
  logo_url          text,
  api_football_id   int  unique,
  created_at        timestamptz default now()
);

-- ─── SEASONS ─────────────────────────────────────────────────────────────────
create table seasons (
  id         uuid primary key default gen_random_uuid(),
  year       text not null unique,  -- e.g. "2024-25"
  is_current boolean not null default false
);

-- ─── MATCHES ─────────────────────────────────────────────────────────────────
create table matches (
  id                uuid primary key default gen_random_uuid(),
  api_football_id   int  unique,
  season_id         uuid not null references seasons(id) on delete cascade,
  home_team_id      uuid not null references teams(id),
  away_team_id      uuid not null references teams(id),
  matchday          int,
  kickoff_at        timestamptz,
  status            text not null default 'scheduled'
                    check (status in ('scheduled','live','finished')),
  home_score        int,
  away_score        int
);

-- ─── REFEREES ────────────────────────────────────────────────────────────────
create table referees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  nationality text
);

-- ─── STANDINGS (Real Table snapshots) ────────────────────────────────────────
create table standings (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  season_id   uuid not null references seasons(id) on delete cascade,
  position    int  not null,
  points      int  not null default 0,
  played      int  not null default 0,
  won         int  not null default 0,
  drawn       int  not null default 0,
  lost        int  not null default 0,
  gf          int  not null default 0,
  ga          int  not null default 0,
  gd          int  generated always as (gf - ga) stored,
  synced_at   timestamptz default now(),
  unique(team_id, season_id)
);

-- ─── INCIDENTS ───────────────────────────────────────────────────────────────
create table incidents (
  id                uuid primary key default gen_random_uuid(),
  match_id          uuid not null references matches(id) on delete cascade,
  referee_id        uuid references referees(id),
  team_affected_id  uuid not null references teams(id),
  type              text not null
                    check (type in ('penalty','red_card','disallowed_goal')),
  minute            int  not null check (minute >= 1),
  severity          float not null,   -- 1.0 or 0.8
  time_weight       float not null,   -- 1.0 / 1.5 / 2.0
  game_state        float not null default 0,
  piv_preview       float generated always as ((severity * time_weight) + game_state) stored,
  piv_confirmed     float,            -- null until admin closes
  vote_closes_at    timestamptz,      -- set to next matchday kickoff
  status            text not null default 'open'
                    check (status in ('open','confirmed')),
  created_at        timestamptz default now(),
  closed_at         timestamptz
);

-- ─── PANEL VERDICTS (International Retired Refs, 60% weight) ─────────────────
create table panel_verdicts (
  id           uuid primary key default gen_random_uuid(),
  incident_id  uuid not null references incidents(id) on delete cascade,
  ref_name     text not null,
  verdict      text not null check (verdict in ('correct','incorrect','inconclusive')),
  submitted_by uuid references auth.users(id),
  created_at   timestamptz default now()
);

-- ─── FAN VOTES (40% weight) ───────────────────────────────────────────────────
create table fan_votes (
  id           uuid primary key default gen_random_uuid(),
  incident_id  uuid not null references incidents(id) on delete cascade,
  user_id      uuid not null references auth.users(id),
  vote         text not null check (vote in ('correct','incorrect')),
  created_at   timestamptz default now(),
  unique(incident_id, user_id)
);

-- ─── REFEREE ACCURACY (Consistency Matrix) ───────────────────────────────────
create table referee_accuracy (
  id             uuid primary key default gen_random_uuid(),
  referee_id     uuid not null references referees(id) on delete cascade,
  team_id        uuid not null references teams(id) on delete cascade,
  season_id      uuid not null references seasons(id) on delete cascade,
  correct_calls  int not null default 0,
  total_calls    int not null default 0,
  unique(referee_id, team_id, season_id)
);

-- Computed accuracy view (avoids division-by-zero)
create view referee_accuracy_pct as
  select
    ra.*,
    r.name        as referee_name,
    r.nationality as referee_nationality,
    t.name        as team_name,
    s.year        as season_year,
    case
      when ra.total_calls = 0 then null
      else ra.correct_calls::float / ra.total_calls
    end as accuracy_pct
  from referee_accuracy ra
  join referees r  on r.id = ra.referee_id
  join teams    t  on t.id = ra.team_id
  join seasons  s  on s.id = ra.season_id;

-- Inconsistency flags: referees with >20% accuracy gap between any two teams
create view inconsistent_referees as
  select
    a.referee_id,
    r.name as referee_name,
    a.team_id  as team_a_id,
    ta.name    as team_a_name,
    b.team_id  as team_b_id,
    tb.name    as team_b_name,
    a.season_id,
    case when a.total_calls = 0 then null else a.correct_calls::float / a.total_calls end as accuracy_a,
    case when b.total_calls = 0 then null else b.correct_calls::float / b.total_calls end as accuracy_b,
    abs(
      case when a.total_calls = 0 then 0 else a.correct_calls::float / a.total_calls end -
      case when b.total_calls = 0 then 0 else b.correct_calls::float / b.total_calls end
    ) as accuracy_gap
  from referee_accuracy a
  join referee_accuracy b  on  b.referee_id = a.referee_id
                           and b.season_id  = a.season_id
                           and b.team_id    > a.team_id   -- avoid duplicate pairs
  join referees r          on  r.id = a.referee_id
  join teams    ta         on  ta.id = a.team_id
  join teams    tb         on  tb.id = b.team_id
  where
    a.total_calls > 0 and b.total_calls > 0
    and abs(
      a.correct_calls::float / a.total_calls -
      b.correct_calls::float / b.total_calls
    ) > 0.20;

-- ─── JUSTICE TABLE VIEWS ──────────────────────────────────────────────────────

-- Projected: Real points + SUM(piv_preview) from all open+confirmed incidents
create view justice_table_projected as
  select
    s.team_id,
    t.name        as team_name,
    t.logo_url,
    s.season_id,
    s.position    as real_position,
    s.points      as real_points,
    s.played, s.won, s.drawn, s.lost, s.gf, s.ga, s.gd,
    coalesce(sum(i.piv_preview), 0)                   as piv_total_preview,
    s.points + coalesce(sum(i.piv_preview), 0)        as justice_points_projected
  from standings s
  join teams t on t.id = s.team_id
  left join incidents i on i.team_affected_id = s.team_id
    and i.match_id in (select id from matches where season_id = s.season_id)
  group by s.team_id, t.name, t.logo_url, s.season_id,
           s.position, s.points, s.played, s.won, s.drawn, s.lost, s.gf, s.ga, s.gd;

-- Confirmed: Real points + SUM(piv_confirmed) from closed incidents only
create view justice_table_confirmed as
  select
    s.team_id,
    t.name        as team_name,
    t.logo_url,
    s.season_id,
    s.position    as real_position,
    s.points      as real_points,
    s.played, s.won, s.drawn, s.lost, s.gf, s.ga, s.gd,
    coalesce(sum(i.piv_confirmed), 0)                   as piv_total_confirmed,
    s.points + coalesce(sum(i.piv_confirmed), 0)        as justice_points_confirmed
  from standings s
  join teams t on t.id = s.team_id
  left join incidents i on i.team_affected_id = s.team_id
    and i.status = 'confirmed'
    and i.match_id in (select id from matches where season_id = s.season_id)
  group by s.team_id, t.name, t.logo_url, s.season_id,
           s.position, s.points, s.played, s.won, s.drawn, s.lost, s.gf, s.ga, s.gd;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table teams             enable row level security;
alter table seasons           enable row level security;
alter table matches           enable row level security;
alter table referees          enable row level security;
alter table standings         enable row level security;
alter table incidents         enable row level security;
alter table panel_verdicts    enable row level security;
alter table fan_votes         enable row level security;
alter table referee_accuracy  enable row level security;

-- Public read access
create policy "public read teams"            on teams            for select using (true);
create policy "public read seasons"          on seasons          for select using (true);
create policy "public read matches"          on matches          for select using (true);
create policy "public read referees"         on referees         for select using (true);
create policy "public read standings"        on standings        for select using (true);
create policy "public read incidents"        on incidents        for select using (true);
create policy "public read panel_verdicts"   on panel_verdicts   for select using (true);
create policy "public read referee_accuracy" on referee_accuracy for select using (true);

-- Fan votes: authenticated users insert their own vote; read after voting handled in app
create policy "fan vote insert" on fan_votes
  for insert with check (auth.uid() = user_id);
create policy "fan vote read own" on fan_votes
  for select using (auth.uid() = user_id);

-- Admin-only writes enforced via service-role key in API routes

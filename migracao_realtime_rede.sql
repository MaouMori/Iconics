do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'social_posts'
  ) then
    alter publication supabase_realtime add table public.social_posts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'social_post_comments'
  ) then
    alter publication supabase_realtime add table public.social_post_comments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'social_direct_messages'
  ) then
    alter publication supabase_realtime add table public.social_direct_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'site_notifications'
  ) then
    alter publication supabase_realtime add table public.site_notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'member_card_link_requests'
  ) then
    alter publication supabase_realtime add table public.member_card_link_requests;
  end if;
end $$;

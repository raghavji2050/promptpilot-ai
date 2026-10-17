-- Supabase grants EXECUTE on new public functions to anon/authenticated via default
-- privileges, so "revoke ... from public" does not remove anon's grant.
-- These functions already fail closed for anon (AUTH_REQUIRED), this removes the grant too.
-- Safe to re-run.
revoke execute on function public.create_share(text, uuid, public.visibility) from anon;
revoke execute on function public.consume_quota(public.quota_action) from anon;
revoke execute on function public.grant_pro_from_purchase(public.pay_provider, text) from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.enforce_saved_prompt_cap() from anon, authenticated;

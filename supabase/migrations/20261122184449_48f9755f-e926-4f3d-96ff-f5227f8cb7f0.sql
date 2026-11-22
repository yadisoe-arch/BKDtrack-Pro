REVOKE EXECUTE ON FUNCTION public.grant_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.grant_allows_pilar(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.grant_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_allows_pilar(uuid, text) TO authenticated;
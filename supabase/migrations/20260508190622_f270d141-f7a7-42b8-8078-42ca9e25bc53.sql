REVOKE EXECUTE ON FUNCTION public.toggle_user_suspension(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.toggle_product_visibility(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_producer(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_subscription_global(boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_subscription_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_boost_global(boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_boost_user(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.toggle_user_suspension(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_product_visibility(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_producer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_subscription_global(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_subscription_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_boost_global(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_boost_user(uuid) TO authenticated;
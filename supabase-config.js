(function () {
  const SUPABASE_URL = "https://jhebbjduvustnsdpxkqx.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wHzTwnwOGMPk8YNd3_AO0w_L0fgLFUD";

  if (!window.supabase?.createClient) {
    console.error("A biblioteca do Supabase não foi carregada.");
    return;
  }

  window.skarSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();

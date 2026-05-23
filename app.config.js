// Dynamic Expo config — wraps app.json so `extra` can be sourced from
// EXPO_PUBLIC_* env vars at build time. This is how every environment override
// (local API vs Fly prod, dev Supabase vs prod) flows into the runtime via
// Constants.expoConfig.extra.
//
// Config dinamica do Expo: envolve o app.json para que `extra` seja sobrescrito
// por variaveis EXPO_PUBLIC_* no build. Default aponta pra Fly de producao
// porque eh o caminho que vai funcionar pra qualquer dev fora da rede LAN.

const DEFAULT_API_URL = "https://forward-api-java.fly.dev";
const DEFAULT_SUPABASE_URL = "https://ysewoopjgdpvnkfhffgy.supabase.co";

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? config.extra?.supabaseAnonKey,
  },
});

// Dynamic Expo config. Wraps app.json so build-time env vars flow into the
// runtime (Constants.expoConfig.extra) and into native build properties.
//
// Config dinamica do Expo: variaveis EXPO_PUBLIC_* no build viram `extra`.
//   EXPO_PUBLIC_API_URL  URL da forward-api-java (default: Fly.io, HTTPS)
//   ALLOW_HTTP=1         so para builds de teste local (emulador -> http://10.0.2.2:8080);
//                        o APK de release fica HTTPS-only (cleartext bloqueado).

const DEFAULT_API_URL = "https://forward-api-java.fly.dev";
const allowHttp = process.env.ALLOW_HTTP === "1";

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ["expo-build-properties", { android: { usesCleartextTraffic: allowHttp } }],
  ],
  extra: {
    ...config.extra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL,
  },
});

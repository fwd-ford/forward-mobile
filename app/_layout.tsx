import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import "@/i18n";
import { colors } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const sub = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.data.subscription.unsubscribe();
  }, []);

  useGuardedRedirect(ready, session);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "" }} />
        <Stack.Screen name="lead/[id]" options={{ title: "Lead" }} />
      </Stack>
    </SafeAreaProvider>
  );
}

// useGuardedRedirect sends unauthenticated users to /login and authenticated
// users away from /login to the tab root.
// useGuardedRedirect: redireciona sem sessao para /login; com sessao, saido da /login.
function useGuardedRedirect(ready: boolean, session: Session | null) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const onLogin = segments[0] === "login";
    if (!session && !onLogin) {
      router.replace("/login");
    } else if (session && onLogin) {
      router.replace("/");
    }
  }, [ready, session, segments]);
}

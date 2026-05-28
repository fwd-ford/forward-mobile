import { enableScreens } from "react-native-screens";
import { Ionicons } from "@expo/vector-icons";

// Without this, react-native-screens disables itself on web (ENABLE_SCREENS
// = isNativePlatformSupported), so bottom-tabs falls back to raw <View>s that
// never hide inactive tabs. freezeOnBlur/lazy/animation:none all noop in that
// fallback path. Forcing it on routes us through Screen.web.tsx which sets
// display:'none' on activityState=INACTIVE, making the tab swap clean.
// Sem isso, screens-on-web nao desliga abas inativas e elas sobrepoem.
enableScreens(true);

import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import "@/i18n";
import { IntroVideo } from "@/components/ui/IntroVideo";
import { MeshBackground } from "@/components/ui/MeshBackground";
import { LocaleProvider } from "@/context/LocaleContext";
import { NavigationThemeBridge, ThemeProvider, useTheme } from "@/context/ThemeContext";
import { UserLocationProvider } from "@/context/UserLocationContext";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationThemeBridge>
          <LocaleProvider>
            <UserLocationProvider>
              <RootStack />
            </UserLocationProvider>
          </LocaleProvider>
        </NavigationThemeBridge>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { colors, mode, isHydrated: themeHydrated } = useTheme();
  const [introDone, setIntroDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  // Preload Ionicons + Playfair Display (display serif) + Manrope (UI sans)
  // so first paint never shows fallback fonts or empty glyph squares (FOIT).
  // Pre-carrega Ionicons + Playfair + Manrope; sem isso, primeiro paint usa
  // fonte de sistema e estraga a hierarquia tipografica.
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  // Auth check runs in parallel with the intro — whichever finishes later unblocks the router.
  // Verificacao de sessao roda em paralelo com a intro — o mais lento destrava o router.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const sub = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.data.subscription.unsubscribe();
  }, []);

  useGuardedRedirect(ready && introDone && themeHydrated, session);

  return (
    // Solid bg colors.bg before the mesh paints — without this, the system
    // fallback (white on web, sometimes on RN-screens) flashes through if the
    // mesh layer is delayed by a frame. Mesh + glass surfaces still render on top.
    // Bg solido como rede de seguranca; sem isso, branco do sistema pisca.
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {/* Mesh sits behind every route so glass surfaces have texture to blur. */}
      {/* Mesh fica atras de tudo pra o glass ter algo pra borrar. */}
      <MeshBackground />
      {!introDone ? (
        <IntroVideo onFinished={() => setIntroDone(true)} />
      ) : !ready || !themeHydrated || !fontsLoaded ? null : (
        <Stack
          screenOptions={{
            // contentStyle transparent so MeshBackground shows through every route.
            // contentStyle transparente: deixa o MeshBackground aparecer atras.
            headerStyle: { backgroundColor: "transparent" },
            headerTransparent: true,
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "" }} />
          <Stack.Screen name="lead/[id]" options={{ headerShown: false }} />
        </Stack>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

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

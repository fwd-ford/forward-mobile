// Login — Glass Minimalist redesign (Fase 2, screen 1/6).
// Inputs are intentionally inline (not the shared Input component) per the
// "screen-by-screen first, componentize later" workflow. Same goes for the
// CTA — bare Pressable pill instead of the shared Button.
//
// Login redesenhado: inputs underline + pill CTA inline (sem componentes).

import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useTheme } from "@/context/ThemeContext";
import { useFadeIn } from "@/hooks/useFadeIn";
import { useShake } from "@/hooks/useShake";
import { signInWithEmail } from "@/lib/auth";
import { haptic } from "@/lib/haptics";
import { fontFamily, radius, spacing, typography, type ThemeColors } from "@/lib/theme";
import {
  validateEmail,
  validatePassword,
  type ValidationError,
} from "@/lib/validation";

type Errors = {
  email?: ValidationError;
  password?: ValidationError;
};

function validate(values: { email: string; password: string }): Errors {
  const errors: Errors = {};
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  const password = validatePassword(values.password);
  if (password) errors.password = password;
  return errors;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { translateX, shake } = useShake();
  const { opacity, translateY } = useFadeIn(360);

  const scale = useRef(new Animated.Value(0.96)).current;
  useMemo(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 8,
      bounciness: 6,
    }).start();
    return null;
  }, [scale]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: "", variant: "info" });

  const errors = useMemo(() => validate({ email, password }), [email, password]);
  const visibleErrors: Errors = submitted ? errors : {};
  const hasErrors = Object.keys(errors).length > 0;
  const buttonDisabled = submitted && hasErrors;

  async function onSubmit() {
    setSubmitted(true);
    setServerError(null);
    if (hasErrors) {
      haptic.error();
      shake();
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      haptic.success();
      router.replace("/");
    } catch {
      haptic.error();
      setServerError(t("auth.error"));
      shake();
    } finally {
      setLoading(false);
    }
  }

  function onForgotPassword() {
    haptic.light();
    setToast({
      visible: true,
      message: t("auth.forgot_help"),
      variant: "info",
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing["5xl"], paddingBottom: insets.bottom + spacing["3xl"] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            { opacity, transform: [{ translateY }, { scale }] },
          ]}
        >
          {/* Wordmark Ford pequeno (Inter — assinatura da marca, fica sans).
              Hero principal vem em Fraunces, consistente com Home/Leads/Profile. */}
          <Text style={styles.brand}>FORD</Text>
          <Text style={styles.heroTitle}>{t("auth.welcome")}</Text>
          <Text style={styles.tagline}>{t("auth.subtitle")}</Text>
        </Animated.View>

        <Animated.View style={[styles.form, { transform: [{ translateX }] }]}>
          <UnderlineInput
            colors={colors}
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.email_placeholder")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            // RFC 5321: total mailbox size cap = 254. Trunca no input pra
            // bloquear payload flooding antes mesmo da validacao por regex.
            maxLength={254}
            focused={emailFocused}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            error={
              visibleErrors.email
                ? t(visibleErrors.email.key, visibleErrors.email.vars)
                : undefined
            }
          />
          <UnderlineInput
            colors={colors}
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            placeholder=""
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            // 128 cobre passphrases longas sem permitir DoS via senha gigante.
            // Supabase corta em 72 (bcrypt) — limitar antes evita request grande.
            maxLength={128}
            focused={passwordFocused}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            error={
              visibleErrors.password
                ? t(visibleErrors.password.key, visibleErrors.password.vars)
                : undefined
            }
          />

          {serverError ? (
            <Text style={styles.serverErrorText}>{serverError}</Text>
          ) : null}
        </Animated.View>

        <View style={styles.footer}>
          <Pressable
            onPress={onSubmit}
            disabled={buttonDisabled || loading}
            accessibilityRole="button"
            accessibilityState={{ disabled: buttonDisabled || loading, busy: loading }}
            style={({ pressed }) => [
              styles.pillCTA,
              (buttonDisabled || loading) && styles.pillCTADisabled,
              pressed && styles.pillCTAPressed,
            ]}
          >
            {loading ? (
              <View style={styles.pillCTALoading}>
                <ActivityIndicator color={colors.primaryText} />
                <Text style={styles.pillCTALabel}>{t("auth.signing_in")}</Text>
              </View>
            ) : (
              <Text style={styles.pillCTALabel}>{t("auth.sign_in")}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onForgotPassword}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("auth.forgot_password")}
            style={({ pressed }) => [styles.forgotWrap, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.forgotLabel}>{t("auth.forgot_password")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

// Inline minimal underline input. Lives here for now per the screen-by-screen
// workflow; gets extracted to a shared <UnderlineInput> in Phase 3.
type UnderlineInputProps = {
  colors: ThemeColors;
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  autoCorrect?: boolean;
  autoComplete?: "email" | "password";
  maxLength?: number;
};

function UnderlineInput({
  colors,
  label,
  value,
  onChangeText,
  placeholder,
  focused,
  onFocus,
  onBlur,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  maxLength,
}: UnderlineInputProps) {
  const lineColor = error ? colors.error : focused ? colors.text : colors.border;
  return (
    <View style={inputStyles.wrap}>
      <Text style={[inputStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[
          inputStyles.input,
          {
            color: colors.text,
            borderBottomColor: lineColor,
            // Erro: dobra a espessura pra dar destaque (antes ficava igual
            // ao estado neutro, so a mensagem abaixo virava vermelha).
            borderBottomWidth: error ? 1.5 : StyleSheet.hairlineWidth + 0.5,
          },
          // Remove o outline DOM do browser no web (input password ganhava
          // box de focus que email nao mostrava — inconsistencia visual).
          Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null,
        ]}
      />
      {error ? (
        <Text style={[inputStyles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  label: {
    ...typography.labelCaps,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.bodyLg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth + 0.5,
  },
  error: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    // Transparent so the MeshBackground at the root shows through.
    container: { flex: 1, backgroundColor: "transparent" },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing["2xl"],
      // justifyContent removido — antes era space-between, gerando ~30% de
      // espaco morto entre form e footer. Form agora flui logo abaixo do
      // hero; footer continua no fim por marginTop auto.
    },
    header: {
      alignItems: "flex-start",
      marginBottom: spacing["2xl"],
      gap: spacing.xs,
    },
    brand: {
      // Wordmark Ford reduzido — assinatura da marca, nao hero.
      // Antes: 72pt Inter Bold dominando a tela inteira.
      fontFamily: fontFamily.bold,
      fontSize: 18,
      letterSpacing: 2,
      color: c.textMuted,
      marginBottom: spacing.md,
    },
    heroTitle: {
      // Hero serif consistente com Home ("Boa tarde"), Leads, Profile.
      fontFamily: fontFamily.displayBold,
      fontSize: 48,
      letterSpacing: -0.8,
      color: c.text,
      lineHeight: 52,
    },
    tagline: {
      ...typography.bodyLg,
      color: c.textMuted,
      maxWidth: 320,
      marginTop: spacing.xs,
    },
    form: { width: "100%" },
    serverErrorText: {
      ...typography.caption,
      color: c.error,
      marginTop: spacing.sm,
    },
    footer: { gap: spacing.sm, marginTop: "auto", paddingTop: spacing["3xl"] },
    pillCTA: {
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    pillCTADisabled: { opacity: 0.45 },
    pillCTAPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
    pillCTALoading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    pillCTALabel: {
      ...typography.bodyLg,
      fontFamily: fontFamily.semibold,
      color: c.primaryText,
    },
    forgotWrap: {
      alignItems: "center",
      paddingVertical: spacing.lg,
    },
    forgotLabel: {
      ...typography.caption,
      fontFamily: fontFamily.medium,
      color: c.textMuted,
    },
  });
}

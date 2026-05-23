import { useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useTheme } from "@/context/ThemeContext";
import { useFadeIn } from "@/hooks/useFadeIn";
import { useShake } from "@/hooks/useShake";
import { signInWithEmail } from "@/lib/auth";
import { haptic } from "@/lib/haptics";
import { fontWeight, radius, spacing, typography, type ThemeColors } from "@/lib/theme";
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

  // Scale-in for the header — sits on top of the fade. Subtle (0.96 -> 1).
  // Scale leve junto do fade pra entrada mais viva.
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
      message: t("common.coming_soon"),
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
          { paddingTop: insets.top + spacing["4xl"], paddingBottom: insets.bottom + spacing["2xl"] },
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
          <Text style={styles.brand}>FORD</Text>
          <Text style={styles.title}>{t("app.name")}</Text>
          <Text style={styles.subtitle}>{t("auth.subtitle")}</Text>
        </Animated.View>

        <View style={styles.form}>
          <Input
            label={t("auth.email")}
            placeholder={t("auth.email_placeholder")}
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            shakeAnim={translateX}
            error={
              visibleErrors.email
                ? t(visibleErrors.email.key, visibleErrors.email.vars)
                : undefined
            }
          />
          <Input
            label={t("auth.password")}
            placeholder="••••••"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            shakeAnim={translateX}
            error={
              visibleErrors.password
                ? t(visibleErrors.password.key, visibleErrors.password.vars)
                : undefined
            }
          />

          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          <Button
            label={t("auth.sign_in")}
            loading={loading}
            disabled={buttonDisabled}
            onPress={onSubmit}
            style={styles.submit}
          />
        </View>

        <Pressable
          onPress={onForgotPassword}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("auth.forgot_password")}
          style={({ pressed }) => [styles.forgotWrap, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.forgotLabel}>{t("auth.forgot_password")}</Text>
        </Pressable>
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

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: spacing["2xl"],
      gap: spacing.xs,
    },
    brand: {
      fontSize: 40,
      fontWeight: fontWeight.extrabold,
      letterSpacing: 6,
      color: c.primary,
      marginBottom: spacing.md,
    },
    title: { ...typography.h1, color: c.text },
    subtitle: {
      ...typography.body,
      color: c.textMuted,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
    },
    form: { width: "100%" },
    serverErrorBox: {
      borderWidth: 1,
      borderColor: c.error,
      backgroundColor: c.errorSoft,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    serverErrorText: {
      ...typography.caption,
      fontWeight: "600",
      color: c.error,
      textAlign: "center",
    },
    submit: { marginTop: spacing.md },
    forgotWrap: {
      alignItems: "center",
      paddingVertical: spacing.lg,
      marginTop: spacing.md,
    },
    forgotLabel: {
      ...typography.caption,
      color: c.primary,
      fontWeight: "600",
    },
  });
}

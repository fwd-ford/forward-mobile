import { useMemo, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
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
import { useTheme } from "@/context/ThemeContext";
import { useFadeIn } from "@/hooks/useFadeIn";
import { useShake } from "@/hooks/useShake";
import { signInWithEmail } from "@/lib/auth";
import { haptic } from "@/lib/haptics";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing["4xl"], paddingBottom: insets.bottom + spacing["4xl"] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity, transform: [{ translateY }] }]}>
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
      </ScrollView>
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
    },
    title: { ...typography.h1, color: c.text },
    subtitle: {
      ...typography.body,
      color: c.textMuted,
      marginTop: spacing.sm,
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
  });
}

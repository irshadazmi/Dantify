
// src/app/(auth)/register.tsx

import React from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { useStyles } from "@/styles/styles";
import { useAppColors } from "@/hooks/use-app-colors";
import { AppText } from "@/components/ui/app-text";
import { AppChipGroup } from "@/components/ui/app-chip-group";
import RegisterForm, {
  type RegisterFormValues,
} from "@/components/forms/register-form";
import { authService } from "@/services/auth-service";
import type { RegisterRequest } from "@/types/auth";
import {
  REGISTRATION_ROLE_OPTIONS,
  type RegistrationRole,
} from "@/constants/CONSTANTS";

type UserType = "clinic" | "patient" | "dentist" | "laboratory";

type ApiError = {
  message?: string;
  detail?: string;
  errors?: Record<string, string | string[]>;
};

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const apiError = error as {
      message?: string;
      response?: { data?: ApiError };
    };
    const data = apiError.response?.data;

    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      const message = Array.isArray(first) ? first[0] : first;
      if (message) return message;
    }

    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (apiError.message) return apiError.message;
  }

  return "Unable to create your account. Please check your details and try again.";
}

export default function RegisterScreen() {
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const [role, setRole] = React.useState<UserType>("clinic");
  const [values, setValues] = React.useState<RegisterFormValues | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRegister = async () => {
    if (submitting) return;
    setError(null);

    if (!values) {
      setError("Please complete the account details.");
      return;
    }
    if (!values.phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!values.otp_verified || !values.verification_token) {
      setError("Please verify your phone number before registering.");
      return;
    }
    if (!values.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (values.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (values.password !== values.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: RegisterRequest = {
        phone: values.phone.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        password_confirmation: values.confirm_password,
        role,
        verification_token: values.verification_token,
      };

      // Registration does not automatically sign in.
      await authService.register(payload);
      console.log('[Registration] Selected role:', role);
      await authService.register(payload);
      router.replace("/(auth)/login" as never);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: keyboardVisible ? "flex-start" : "center",
          paddingTop: keyboardVisible ? 8 : 16,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { paddingTop: 8 }]}>
          <View style={{ alignItems: "center", marginBottom: 6 }}>
            <Image
              source={require("@/assets/images/dantify-logo.png")}
              style={{ width: "100%", height: 150 }}
              resizeMode="contain"
              accessibilityLabel="Dantify logo"
            />
          </View>

          <AppText style={styles.title}>Create an Account</AppText>

          <View style={{ marginBottom: 8 }}>
            <AppText style={styles.chipLabel}>Register As:</AppText>
            <AppChipGroup
              options={REGISTRATION_ROLE_OPTIONS}
              value={role}
              onChange={(value) => {
                setRole(value as RegistrationRole);
                setError(null);
              }}
            />
          </View>

          <View style={[styles.card, { paddingTop: 10, paddingBottom: 10 }]}>
            <AppText variant="subtitle" style={{ marginBottom: 6 }}>
              Account Details
            </AppText>

            <RegisterForm
              onChange={setValues}
              onSendOtp={async (phone) => {
                await authService.sendOtp(phone);
              }}
              onVerifyOtp={async (phone, otp) => {
                const result = await authService.verifyOtp(phone, otp);
                return result.verification_token;
              }}
            />

            {error && (
              <View
                accessibilityRole="alert"
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                }}
              >
                <AppText variant="error">{error}</AppText>
              </View>
            )}

            <Pressable
              onPress={handleRegister}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: submitting, busy: submitting }}
              style={[
                styles.button,
                { marginTop: 8, opacity: submitting ? 0.7 : 1 },
              ]}
            >
              {submitting ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ActivityIndicator color={colors.badgeText} />
                  <Text style={styles.buttonText}>Creating account...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 6,
              marginBottom: 4,
            }}
          >
            <Text style={styles.mutedText}>Already have an account? </Text>
            <Pressable
              onPress={() => router.push("/(auth)/login" as never)}
              accessibilityRole="link"
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Sign in
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

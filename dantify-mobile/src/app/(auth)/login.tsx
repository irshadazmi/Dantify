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
  TextInput,
  View,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useStyles } from "@/styles/styles";
import { useAppColors } from "@/hooks/use-app-colors";
import { useAuth } from "@/contexts/auth-context";
import { AppText } from "@/components/ui/app-text";
import { getPostAuthRoute } from "@/utils/auth-navigation";

/* ======================================================
   VALIDATION
====================================================== */

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

/* ======================================================
   API ERROR HANDLING
====================================================== */

type ApiErrorResponse = {
  message?: string;
  detail?: string;
  errors?: Record<string, string | string[]>;
};

function getLoginErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "Unable to sign in. Please try again.";
  }

  const err = error as {
    message?: string;
    response?: {
      data?: ApiErrorResponse;
    };
  };

  const data = err.response?.data;

  if (data?.errors) {
    const firstError = Object.values(data.errors)[0];
    const message = Array.isArray(firstError)
      ? firstError[0]
      : firstError;

    if (message) return message;
  }

  if (data?.detail) return data.detail;
  if (data?.message) return data.message;

  return "Invalid email or password. Please try again.";
}

/* ======================================================
   ROUTE HELPERS
====================================================== */

/**
 * Accept only the intended internal booking route.
 * This prevents arbitrary external or unrelated redirects.
 */
function getSafeBookingRedirect(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  // Allow only the booking destinations used by Dantify.
  if (value === "/booking/availability" || value === "/booking/review") {
    return value;
  }

  // Retain backward compatibility with the older booking route.
  return /^\/booking\?dentistId=[1-9]\d*$/.test(value)
    ? value
    : null;
}

function getBookingRouteParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (key === "redirectTo" || value === undefined) {
      return;
    }

    result[key] = Array.isArray(value) ? value[0] : value;
  });

  return result;
}

/**
 * Normalize role whether the API returns:
 * "patient" or { name: "patient" }.
 */
function getRoleName(role: unknown): string {
  if (typeof role === "string") {
    return role.trim().toLowerCase();
  }

  if (typeof role === "object" && role !== null && "name" in role) {
    const name = (role as { name?: unknown }).name;

    return typeof name === "string"
      ? name.trim().toLowerCase()
      : "";
  }

  return "";
}

/* ======================================================
   COMPONENT
====================================================== */

export default function LoginScreen() {
  const styles = useStyles();
  const COLORS = useAppColors();
  const router = useRouter();

  const params = useLocalSearchParams<
    Record<string, string | string[]>
  >();

  const redirectParam = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;

  const redirectTo = getSafeBookingRedirect(redirectParam);

  const bookingParams = getBookingRouteParams(params);

  const { loginWithCredentials } = useAuth();

  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    control,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const isBusy = submitting || isSubmitting;

  const onSubmit = async (values: LoginFormValues) => {
    if (isBusy) return;

    setSubmitting(true);
    setFormError(null);
    clearErrors();

    try {
      const response = await loginWithCredentials(
        values.email.trim(),
        values.password,
      );

      const role = getRoleName(response.user?.role);

      const postAuthRoute = getPostAuthRoute(
        response.user,
        response.next_step,
      );

      if (
        role === "patient" &&
        (redirectTo === "/booking/availability" || redirectTo === "/booking/review")
      ) {
        router.replace({
          pathname: redirectTo,
          params: bookingParams,
        } as never);
      } else if (role === "patient" && redirectTo) {
        // Backward compatibility with the previous booking route.
        router.replace(redirectTo as never);
      } else {
        router.replace(postAuthRoute as never);
      }
    } catch (error: unknown) {
      const message = getLoginErrorMessage(error);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------------------------------------------
     KEYBOARD VISIBILITY
  ---------------------------------------------------- */

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
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: keyboardVisible ? "flex-start" : "center",
          paddingTop: keyboardVisible ? 8 : 14,
          paddingBottom: 20,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* ---------- BRAND ---------- */}

          <View
            style={{
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Image
              source={require("@/assets/images/dantify-logo.png")}
              style={{
                width: 132,
                height: 108,
              }}
              resizeMode="contain"
              accessibilityLabel="Dantify logo"
            />

            <AppText
              style={[
                styles.title,
                { marginTop: 2, marginBottom: 4, fontSize: 22 },
              ]}
            >
              Welcome to Dantify
            </AppText>

            <Text style={[styles.mutedText, { fontSize: 13 }]}>
              AI-Powered Dental Practice Management
            </Text>
          </View>

          {/* ---------- LOGIN FORM ---------- */}

          <View style={styles.card}>
            {/* Email */}

            <Text style={styles.label}>Email</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.textInput,
                    errors.email
                      ? { borderColor: COLORS.danger }
                      : null,
                  ]}
                  placeholder="dentist@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onChangeText={(text) => {
                    setFormError(null);
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  editable={!isBusy}
                  accessibilityLabel="Email address"
                  accessibilityHint="Enter your registered email address"
                />
              )}
            />

            {errors.email?.message && (
              <Text
                style={styles.errorText}
                accessibilityRole="alert"
              >
                {errors.email.message}
              </Text>
            )}

            {/* Password */}

            <Text style={styles.label}>Password</Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1.5,
                borderColor: errors.password
                  ? COLORS.danger
                  : COLORS.primary,
                borderRadius: 6,
                backgroundColor: COLORS.card,
                marginBottom: errors.password ? 4 : 10,
                shadowColor: COLORS.cardShadow,
                shadowOpacity: 0.1,
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={{
                      flex: 1,
                      height: 44,
                      paddingHorizontal: 10,
                      color: COLORS.text,
                      fontSize: 16,
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={(text) => {
                      setFormError(null);
                      onChange(text);
                    }}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      void handleSubmit(onSubmit)();
                    }}
                    editable={!isBusy}
                    accessibilityLabel="Password"
                  />
                )}
              />

              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                disabled={isBusy}
                hitSlop={8}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: COLORS.primary,
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            {errors.password?.message && (
              <Text
                style={styles.errorText}
                accessibilityRole="alert"
              >
                {errors.password.message}
              </Text>
            )}

            {/* API Error */}

            {formError && (
              <View
                style={{
                  backgroundColor: COLORS.background,
                  borderWidth: 1,
                  borderColor: COLORS.danger,
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 8,
                }}
              >
                <Text
                  style={[
                    styles.errorText,
                    {
                      textAlign: "center",
                      marginBottom: 0,
                    },
                  ]}
                  accessibilityRole="alert"
                >
                  {formError}
                </Text>
              </View>
            )}

            {/* Account recovery and home navigation */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 8,
                marginBottom: 2,
              }}
            >
              <Pressable
                onPress={() => router.push("/(auth)/forgot-password" as never)}
                disabled={isBusy}
                hitSlop={6}
                style={{ paddingVertical: 6, paddingRight: 8 }}
                accessibilityRole="link"
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: COLORS.primary,
                    fontWeight: "500",
                  }}
                >
                  Forgot password?
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.replace("/" as never)}
                disabled={isBusy}
                hitSlop={6}
                style={{ paddingVertical: 6, paddingLeft: 8 }}
                accessibilityRole="link"
                accessibilityLabel="Back to Dantify home"
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: COLORS.primary,
                    fontWeight: "600",
                  }}
                >
                  ‹ Back to Home
                </Text>
              </Pressable>
            </View>

            {/* Submit */}

            <Pressable
              onPress={() => {
                void handleSubmit(onSubmit)();
              }}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: isBusy, busy: isBusy }}
              style={[
                styles.button,
                {
                  marginTop: 16,
                  marginBottom: 8,
                  opacity: isBusy ? 0.7 : 1,
                },
              ]}
            >
              {isBusy ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ActivityIndicator color={COLORS.badgeText} />
                  <Text style={styles.buttonText}>
                    Signing in...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  Sign In
                </Text>
              )}
            </Pressable>
          </View>

          {/* ---------- REGISTER ---------- */}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <Text style={styles.mutedText}>
              Not registered?{" "}
            </Text>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(auth)/register",
                  params: {
                    ...bookingParams,
                    ...(redirectTo ? { redirectTo } : {}),
                  },
                } as never)
              }
              accessibilityRole="link"
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: COLORS.primary,
                }}
              >
                Create an account
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
// src/components/forms/register-form.tsx
// Account fields and phone OTP only. No clinic/patient/dentist profile logic.

import React from "react";
import { View } from "react-native";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { InlineField } from "@/components/ui/inline-field";
import { AppInput } from "@/components/ui/app-input";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppColors } from "@/hooks/use-app-colors";

export type RegisterFormValues = {
  phone: string;
  otp: string;
  otp_verified: boolean;
  verification_token: string;
  email: string;
  password: string;
  confirm_password: string;
};

type Props = {
  onChange: (values: RegisterFormValues) => void;
  onSendOtp: (phone: string) => Promise<void>;
  // Return the server-issued verification token, not a client-side boolean.
  onVerifyOtp: (phone: string, otp: string) => Promise<string>;
};

const Schema = z
  .object({
    phone: z
      .string()
      .trim()
      .regex(/^[0-9]{10,15}$/, "Enter a valid phone number (10–15 digits)"),
    otp: z.string(),
    otp_verified: z.boolean(),
    verification_token: z.string(),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((values, ctx) => {
    if (!values.otp_verified || !values.verification_token) {
      ctx.addIssue({
        code: "custom",
        path: ["otp"],
        message: "Please verify your phone number",
      });
    }
    if (values.password !== values.confirm_password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
  });

export default function RegisterForm({ onChange, onSendOtp, onVerifyOtp }: Props) {
  const colors = useAppColors();
  const [otpSent, setOtpSent] = React.useState(false);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [otpMessage, setOtpMessage] = React.useState<string | null>(null);

  const {
    control,
    getValues,
    setValue,
    trigger,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(Schema) as never,
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      phone: "",
      otp: "",
      otp_verified: false,
      verification_token: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const phone = useWatch({ control, name: "phone" });
  const otp = useWatch({ control, name: "otp" });
  const otpVerified = useWatch({ control, name: "otp_verified" });
  const verificationToken = useWatch({ control, name: "verification_token" });
  const email = useWatch({ control, name: "email" });
  const password = useWatch({ control, name: "password" });
  const confirmPassword = useWatch({ control, name: "confirm_password" });

  React.useEffect(() => {
    onChange({
      phone: phone ?? "",
      otp: otp ?? "",
      otp_verified: otpVerified ?? false,
      verification_token: verificationToken ?? "",
      email: email ?? "",
      password: password ?? "",
      confirm_password: confirmPassword ?? "",
    });
  }, [
    phone,
    otp,
    otpVerified,
    verificationToken,
    email,
    password,
    confirmPassword,
    onChange,
  ]);

  const invalidatePhoneVerification = () => {
    setValue("otp_verified", false, { shouldValidate: true });
    setValue("verification_token", "");
    setValue("otp", "");
    setOtpSent(false);
    setOtpError(null);
    setOtpMessage(null);
  };

  const sendOtp = async () => {
    setOtpError(null);
    setOtpMessage(null);
    if (!(await trigger("phone"))) return;

    try {
      setSendingOtp(true);
      await onSendOtp(getValues("phone").trim());
      setValue("otp_verified", false);
      setValue("verification_token", "");
      setValue("otp", "");
      setOtpSent(true);
      setOtpMessage("Verification code sent.");
    } catch {
      setOtpError("Unable to send OTP. Please check the phone number and try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    setOtpError(null);
    setOtpMessage(null);
    const phone = getValues("phone").trim();
    const otp = getValues("otp").trim();

    if (!otp) {
      setError("otp", { type: "manual", message: "Enter the verification code." });
      return;
    }

    try {
      setVerifyingOtp(true);
      const proof = await onVerifyOtp(phone, otp);
      if (!proof) throw new Error("Missing verification proof");

      setValue("verification_token", proof, { shouldDirty: true });
      setValue("otp_verified", true, { shouldDirty: true, shouldValidate: true });
      clearErrors("otp");
      setOtpMessage("Phone number verified successfully.");
    } catch {
      setValue("verification_token", "");
      setValue("otp_verified", false);
      setOtpError("Invalid or expired OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const fieldError = (message?: string) =>
    message ? <AppText variant="error">{message}</AppText> : null;

  return (
    <View>
      <InlineField label="Phone">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange, onBlur } }) => (
                <AppInput
                  value={value}
                  onChangeText={(text) => {
                    const phone = text.replace(/\D/g, "");
                    if (phone !== getValues("phone")) invalidatePhoneVerification();
                    onChange(phone);
                  }}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                  editable={!sendingOtp && !verifyingOtp}
                  accessibilityLabel="Phone number"
                  style={errors.phone ? { borderColor: colors.danger } : undefined}
                />
              )}
            />
          </View>
          <AppButton
            title={sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
            variant="otp"
            onPress={sendOtp}
            disabled={sendingOtp || verifyingOtp}
          />
        </View>
      </InlineField>
      {fieldError(errors.phone?.message)}

      {otpSent && (
        <InlineField label="OTP">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="otp"
                render={({ field: { value, onChange, onBlur } }) => (
                  <AppInput
                    value={value}
                    onChangeText={(text) => {
                      onChange(text.replace(/\D/g, ""));
                      setOtpError(null);
                      setOtpMessage(null);
                    }}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    placeholder="Enter OTP"
                    accessibilityLabel="One-time password"
                    style={errors.otp ? { borderColor: colors.danger } : undefined}
                  />
                )}
              />
            </View>
            <AppButton
              title={verifyingOtp ? "Verifying..." : "Verify"}
              onPress={verifyOtp}
              disabled={verifyingOtp || sendingOtp}
            />
          </View>
        </InlineField>
      )}
      {fieldError(errors.otp?.message)}
      {otpError && <AppText variant="error">{otpError}</AppText>}
      {otpMessage && <AppText variant="muted">{otpMessage}</AppText>}

      <InlineField label="Email">
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.com"
              accessibilityLabel="Email address"
              style={errors.email ? { borderColor: colors.danger } : undefined}
            />
          )}
        />
      </InlineField>
      {fieldError(errors.email?.message)}

      <InlineField label="Password">
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="At least 8 characters"
              accessibilityLabel="Password"
              style={errors.password ? { borderColor: colors.danger } : undefined}
            />
          )}
        />
      </InlineField>
      {fieldError(errors.password?.message)}

      <InlineField label="Confirm password">
        <Controller
          control={control}
          name="confirm_password"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Re-enter password"
              accessibilityLabel="Confirm password"
              style={errors.confirm_password ? { borderColor: colors.danger } : undefined}
            />
          )}
        />
      </InlineField>
      {fieldError(errors.confirm_password?.message)}
    </View>
  );
}

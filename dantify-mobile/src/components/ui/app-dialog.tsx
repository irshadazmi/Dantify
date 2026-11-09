import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppColors } from "@/hooks/use-app-colors";

export type AppDialogButtonStyle = "default" | "cancel" | "destructive";

export type AppDialogButton = {
  text: string;
  style?: AppDialogButtonStyle;
  onPress?: () => void;
};

export type AppDialogPayload = {
  title: string;
  message?: string;
  buttons: AppDialogButton[];
};

type Listener = (dialog: AppDialogPayload) => void;

const listeners = new Set<Listener>();

/**
 * Theme-aware replacement for React Native Alert.alert().
 * Supports the same title/message/buttons pattern used in Dantify screens.
 */
export function showAppDialog(
  title: string,
  message?: string,
  buttons?: AppDialogButton[],
): void {
  const dialog: AppDialogPayload = {
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: "OK" }],
  };

  listeners.forEach((listener) => listener(dialog));
}

export function AppDialogHost() {
  const colors = useAppColors();
  const [dialog, setDialog] = useState<AppDialogPayload | null>(null);

  useEffect(() => {
    const listener: Listener = (nextDialog) => setDialog(nextDialog);
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const close = () => setDialog(null);

  const handleButtonPress = (button: AppDialogButton) => {
    close();
    button.onPress?.();
  };

  const isError = /error|unable|failed|invalid|required|not sent/i.test(dialog?.title ?? "");
  const isSuccess = /success|created|updated|added|submitted|accepted|saved/i.test(dialog?.title ?? "");
  const iconColor = isError
    ? colors.danger
    : isSuccess
      ? colors.success
      : colors.primary;
  const iconText = isError ? "!" : isSuccess ? "✓" : "?";

  return (
    <Modal
      visible={Boolean(dialog)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.62)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        {dialog && (
          <View
            accessibilityRole="alert"
            style={{
              width: "100%",
              maxWidth: 440,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 20,
              padding: 22,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 18,
              elevation: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
                backgroundColor: iconColor,
              }}
            >
              <AppText
                style={{
                  color: colors.badgeText,
                  fontSize: 25,
                  fontWeight: "800",
                }}
              >
                {iconText}
              </AppText>
            </View>

            <AppText
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: "800",
                marginBottom: dialog.message ? 8 : 2,
              }}
            >
              {dialog.title}
            </AppText>

            {!!dialog.message && (
              <AppText
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  lineHeight: 21,
                }}
              >
                {dialog.message}
              </AppText>
            )}

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 22,
              }}
            >
              {dialog.buttons.map((button, index) => {
                const isCancel = button.style === "cancel";
                const isDestructive = button.style === "destructive";

                return (
                  <Pressable
                    key={`${button.text}-${index}`}
                    onPress={() => handleButtonPress(button)}
                    accessibilityRole="button"
                    style={{
                      minWidth: 96,
                      minHeight: 44,
                      paddingHorizontal: 18,
                      borderRadius: 12,
                      borderWidth: isCancel ? 1 : 0,
                      borderColor: colors.border,
                      backgroundColor: isCancel
                        ? "transparent"
                        : isDestructive
                          ? colors.danger
                          : colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppText
                      style={{
                        color: isCancel ? colors.text : colors.badgeText,
                        fontWeight: "800",
                        fontSize: 14,
                      }}
                    >
                      {button.text}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

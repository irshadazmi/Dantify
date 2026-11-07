
import React from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/app-button';
import { useStyles } from '@/styles/styles';

type Props = {
  title: string;
  subtitle?: string;
  count?: number;

  // Optional primary action
  actionTitle?: string;
  onAction?: () => void;

  // Optional back navigation
  showBack?: boolean;
  onBack?: () => void;
  backTitle?: string;
};

export function ScreenHeader({
  title,
  subtitle,
  count,
  actionTitle,
  onAction,
  showBack = false,
  onBack,
  backTitle = 'Back',
}: Props) {
  const styles = useStyles();

  return (
    <View style={styles.screenHeader}>
      {/* Title and optional back button */}
      <View style={styles.screenHeaderTitleRow}>
        <View style={styles.screenHeaderContent}>
          <View style={styles.screenHeaderTitleRow}>
            <AppText variant="title">{title}</AppText>

            {count !== undefined && (
              <AppText variant="muted">({count})</AppText>
            )}
          </View>
        </View>

        {showBack && onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backTitle}
            hitSlop={8}
            style={({ pressed }) => [
              styles.screenHeaderBackButton,
              pressed && styles.tabBarPressed,
            ]}
          >
            <AppText style={styles.screenHeaderBackText}>
              {'← '}
              {backTitle}
            </AppText>
          </Pressable>
        )}

        {actionTitle && onAction && (
          <AppButton
            title={actionTitle}
            onPress={onAction}
            variant="small"
          />
        )}
      </View>

      {/* Subtitle remains below the title row */}
      {subtitle ? (
        <AppText variant="subtitle">{subtitle}</AppText>
      ) : null}
    </View>
  );
}

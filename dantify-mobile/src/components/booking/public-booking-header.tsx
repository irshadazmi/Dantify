import React, { useState } from 'react';
import {
  Image,
  Keyboard,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { IconSymbol } from '@/components/icon-symbol';
import { useAppColors } from '@/hooks/use-app-colors';

type PublicBookingHeaderProps = {
  location: string;
  onLocationChange: (location: string) => void;
};

export default function PublicBookingHeader({
  location,
  onLocationChange,
}: PublicBookingHeaderProps) {
  const colors = useAppColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [locationDraft, setLocationDraft] = useState(location);

  const openLocationPicker = () => {
    setLocationDraft(location);
    setModalVisible(true);
  };

  const closeLocationPicker = () => {
    Keyboard.dismiss();
    setModalVisible(false);
  };

  const applyLocation = () => {
    const nextLocation = locationDraft.trim();
    if (nextLocation) onLocationChange(nextLocation);
    closeLocationPicker();
  };

  return (
    <>
      <View
        style={{
          minHeight: 64,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 13,
        }}
      >
        <View
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
          }}
        >
          <Image
            source={require('../../../assets/images/icon.png')}
            resizeMode="contain"
            accessibilityLabel="Dantify logo"
            style={{ width: 48, height: 48, flexShrink: 0 }}
          />
          <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
            <AppText
              style={{
                color: colors.text,
                fontSize: 23,
                lineHeight: 27,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}
            >
              Dantify
            </AppText>
            <AppText
              style={{
                color: colors.textSecondary,
                fontSize: 11,
                lineHeight: 15,
              }}
            >
              Dental care, made easier
            </AppText>
          </View>
        </View>

        <Pressable
          onPress={openLocationPicker}
          accessibilityRole="button"
          accessibilityLabel={`Change location. Current location: ${location}`}
          style={{
            maxWidth: '48%',
            minHeight: 50,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <IconSymbol name="location.fill" size={19} color={colors.primary} />
          <View style={{ flexShrink: 1, minWidth: 0, gap: 1 }}>
            <AppText style={{ color: colors.textMuted, fontSize: 10, lineHeight: 13 }}>
              Your location
            </AppText>
            <AppText
              style={{ color: colors.text, fontSize: 13, lineHeight: 17, fontWeight: '700' }}
              numberOfLines={1}
            >
              {location.split(',')[0] || 'Choose location'}
            </AppText>
          </View>
          <IconSymbol name="expand-more" size={17} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLocationPicker}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.58)',
            justifyContent: 'center',
            padding: 22,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 18,
              padding: 18,
              gap: 10,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AppText style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
                Choose your location
              </AppText>
              <Pressable
                onPress={closeLocationPicker}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close location dialog"
              >
                <IconSymbol name="xmark" size={21} color={colors.textSecondary} />
              </Pressable>
            </View>

            <AppText style={{ color: colors.textMuted, fontSize: 12 }}>
              Enter a city, area or PIN code.
            </AppText>

            <TextInput
              value={locationDraft}
              onChangeText={setLocationDraft}
              placeholder="e.g. Baner, Pune"
              placeholderTextColor={colors.textMuted}
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 11,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.text,
                backgroundColor: colors.card,
                fontSize: 15,
                marginTop: 5,
              }}
              returnKeyType="done"
              onSubmitEditing={applyLocation}
              autoFocus
              accessibilityLabel="Enter your preferred search location"
            />

            <Pressable
              onPress={applyLocation}
              style={{
                minHeight: 46,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 5,
                paddingHorizontal: 14,
              }}
              accessibilityRole="button"
            >
              <AppText style={{ color: colors.badgeText, fontSize: 14, fontWeight: '700' }}>
                Apply location
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

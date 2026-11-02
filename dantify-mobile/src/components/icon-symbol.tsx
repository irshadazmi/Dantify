
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Platform,
  TextStyle,
  type OpaqueColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SymbolView,
  type SymbolWeight,
  type SymbolViewProps,
} from 'expo-symbols';
import type { ComponentProps } from 'react';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type SFSymbolName = SymbolViewProps['name'];

const MAPPING: Partial<Record<string, MaterialIconName>> = {
  // Navigation
  'house.fill': 'home',
  'chevron.right': 'chevron-right',
  'chevron.left.forwardslash.chevron.right': 'code',
  'ellipsis.circle.fill': 'more-horiz',
  'line.3.horizontal': 'menu',
  'arrow.uturn.left': 'undo',
  'arrow.uturn.right': 'redo',

  // Dashboard and analytics
  'chart.bar.fill': 'bar-chart',
  'chart.pie.fill': 'pie-chart',
  'brain.head.profile': 'psychology',
  'robotic.vacuum.fill': 'smart-toy',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'chart.bar.xaxis': 'bar-chart',
  'chart.xyaxis.line': 'show-chart',

  // Patients, users, and dentists
  'person.crop.circle': 'account-circle',
  'person.crop.circle.fill': 'account-circle',
  'person.fill': 'person',
  'person.2.fill': 'people',
  'person.3.fill': 'groups',
  'person.badge.plus': 'person-add',
  'person.text.rectangle.fill': 'badge',
  'person.crop.rectangle.stack.fill': 'groups',
  'person.2.badge.gearshape.fill': 'manage-accounts',
  'folder.badge.person.crop': 'folder-shared',

  // Appointments and scheduling
  calendar: 'calendar-today',
  'calendar.badge.clock': 'event',
  'calendar.badge.plus': 'event-available',
  'clock.fill': 'access-time',
  clock: 'schedule',
  'clock.badge.checkmark.fill': 'task-alt',

  // Clinics and location
  'location.fill': 'location-on',
  'building.2.fill': 'business',
  'cross.case.fill': 'medical-services',
  'cross.case': 'medical-services',

  // Dental practice and oral healthcare
  'cross.fill': 'medical-services',
  'tooth': 'medical-services',
  'tooth-outline': 'medical-services',
  'dentistry': 'medical-services',
  'oral-health': 'health-and-safety',
  'dental-care': 'health-and-safety',
  'medical-services': 'medical-services',
  'health-and-safety': 'health-and-safety',
  'stethoscope': 'medical-services',

  // Dental examination and diagnosis
  'clipboard.fill': 'assignment',
  'clipboard.text': 'assignment',
  'list.clipboard.fill': 'assignment',
  'doc.text.magnifyingglass': 'find-in-page',
  'checkmark.seal.fill': 'verified',
  'checkmark.circle.fill': 'check-circle',
  'exclamationmark.triangle.fill': 'warning',
  'waveform.path.ecg': 'monitor-heart',

  // Dental treatments and procedures
  'bandage.fill': 'healing',
  'bandage': 'healing',
  'syringe.fill': 'vaccines',
  'cross.vial.fill': 'science',
  'cross.vial': 'science',
  'scissors': 'content-cut',
  'hand.raised.fingers.spread.fill': 'back-hand',
  'toothbrush': 'cleaning-services',
  'drop.fill': 'water-drop',

  // Dental imaging and radiology
  'xray': 'image-search',
  'photo.fill': 'photo',
  'photo.on.rectangle': 'photo-library',
  'viewfinder': 'center-focus-strong',
  'camera.viewfinder': 'document-scanner',
  'doc.viewfinder': 'document-scanner',

  // Prescriptions and medication
  'pills.fill': 'medication',
  'pills.circle.fill': 'medication',
  'prescription': 'medication',
  'cross.case.circle.fill': 'medical-services',
  'cross.case.circle': 'medical-services',

  // Dental laboratory and prosthetics
  'flask.fill': 'science',
  'testtube.2': 'science',
  'gearshape.2.fill': 'settings',
  'shippingbox.fill': 'inventory-2',
  'shippingbox': 'inventory-2',
  'cube.box.fill': 'inventory-2',
  'hammer.fill': 'handyman',

  // Patient records and medical history
  'doc.text.fill': 'description',
  'doc.plaintext.fill': 'description',
  'doc.richtext': 'article',
  'doc.text.image': 'picture-as-pdf',
  'doc.text.below.ecg': 'description',

  // Clinic operations and staff
  'door.left.hand.open': 'meeting-room',
  'bed.double.fill': 'bed',
  'chair.lounge.fill': 'chair',

  // Dental inventory and supplies
  'archivebox.fill': 'archive',
  'tray.2.fill': 'inventory',
  'barcode.viewfinder': 'qr-code-scanner',
  'qrcode.viewfinder': 'qr-code-scanner',

  // Billing and payments
  'wallet.pass.fill': 'account-balance-wallet',
  'banknote.fill': 'account-balance',
  'dollarsign.circle.fill': 'attach-money',
  'creditcard.fill': 'credit-card',
  'receipt.fill': 'receipt-long',

  // Insurance and claims
  'shield.lefthalf.filled': 'security',
  'shield.checkered': 'verified-user',
  'checkmark.shield.fill': 'verified-user',

  // Files and documents
  'folder.fill': 'folder',
  'tag.fill': 'label',
  'bookmark.fill': 'bookmark',
  'tray.full.fill': 'inbox',
  paperclip: 'attach-file',
  link: 'link',

  // Communication and support
  'paperplane.fill': 'send',
  'envelope.badge.fill': 'feedback',
  'envelope.fill': 'email',
  'bubble.left.fill': 'chat',
  'phone.fill': 'phone',
  'questionmark.circle.fill': 'help',

  // Search
  magnifyingglass: 'search',

  // Media and devices
  'camera.fill': 'photo-camera',
  'mic.fill': 'mic',
  'speaker.wave.2.fill': 'volume-up',
  wifi: 'wifi',
  'battery.100': 'battery-full',

  // Shopping and favorites
  'cart.fill': 'shopping-cart',
  'heart.fill': 'favorite',
  'star.fill': 'star',

  // Information and notifications
  'info.circle': 'info',
  'bell.fill': 'notifications',

  // Actions and utilities
  'plus.circle.fill': 'add-circle',
  'slider.horizontal.3': 'tune',
  'wrench.fill': 'build',
  'arrow.clockwise': 'refresh',
  'arrow.triangle.2.circlepath': 'sync',
  checkmark: 'check',
  'xmark': 'close',
  'xmark.circle.fill': 'cancel',
  'minus.circle.fill': 'remove-circle',
  plus: 'add',
  pencil: 'edit',
  'trash.fill': 'delete',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  hourglass: 'hourglass-empty',

  // Security
  'lock.fill': 'lock',
  'lock.open.fill': 'lock-open',
  'key.fill': 'vpn-key',

  // Settings and logout
  'gearshape.fill': 'settings',
  'arrow.right.square.fill': 'logout',
  'rectangle.portrait.and.arrow.right': 'exit-to-app',
};

type IconSymbolProps = {
  name: SFSymbolName | MaterialIconName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: IconSymbolProps) {
  const symbolName =
    typeof name === 'string' ? name : undefined;

  const mappedName = symbolName ? MAPPING[symbolName] : undefined;

  // Android and web use Material Icons.
  // iOS uses SF Symbols where the name is not a Material mapping.
  if (Platform.OS === 'ios' && !mappedName) {
    return (
      <SymbolView
        name={name as SFSymbolName}
        size={size}
        tintColor={color}
        weight={weight}
        style={style as StyleProp<ViewStyle>}
      />
    );
  }

  const iconName =
    mappedName ??
    (symbolName as MaterialIconName | undefined) ??
    'help-outline';

  return (
    <MaterialIcons
      name={iconName}
      size={size}
      color={color}
      style={style as StyleProp<TextStyle>}
    />
  );
}

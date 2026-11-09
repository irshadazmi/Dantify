// src/app/help/index.tsx

import React, { useState } from 'react';
import {

  Linking,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';

import { showAppDialog } from "@/components/ui/app-dialog";

import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

/* ======================================================
   HELP & SUPPORT – DANTIFY
====================================================== */

const FAQS = [
  {
    q: 'How do I create or update my clinic profile?',
    a: 'Open the Clinics section to manage clinic information, where that functionality is available to your account. Available actions depend on your role and the features enabled in your installation.',
  },
  {
    q: 'How can patients book appointments?',
    a: 'Use the Appointments section to access appointment management. The availability of patient self-booking, available time slots, and booking confirmations depends on the features configured in your installation.',
  },
  {
    q: 'Can I edit patient details?',
    a: 'Open the Patients section to access patient management. The actions available to view or update patient information depend on your account permissions.',
  },
  {
    q: 'How are payments handled?',
    a: 'Dantify is designed to support billing and payment tracking. The availability of payment records, billing operations, and payment integrations depends on the features enabled in your installation.',
  },
  {
    q: 'How does AI help in Dantify?',
    a: 'Dantify is designed to support AI-assisted assistance and insights. The available AI features depend on the AI services and capabilities configured for your installation.',
  },
  {
    q: 'Is patient data secure?',
    a: 'Access to patient information should be managed according to your configured authentication and authorization policies. Contact your administrator if you need help with account access or permissions.',
  },
  {
    q: 'How do I change the application theme?',
    a: 'Open Settings and select System, Light, or Dark under App Theme. Your selection is applied through the application theme settings.',
  },
  {
    q: 'What should I do if something is not working?',
    a: 'Check your connection and try again. If the issue persists, contact your application administrator or use the support email below. Include the screen where the issue occurred and the steps needed to reproduce it. Do not include patient-sensitive information.',
  },
];

/* ======================================================
   COMPONENT
====================================================== */

export default function Help() {
  const styles = useStyles();
  const COLORS = useAppColors();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const contactSupport = async () => {
    const email = 'support@dantify.app';
    const url = `mailto:${email}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        showAppDialog(
          'Contact Support',
          `Please email ${email}`,
        );
      }
    } catch (error) {
      console.error('Unable to open email application:', error);

      showAppDialog(
        'Contact Support',
        `Please email ${email}`,
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ---------- TITLE ---------- */}

      <Text
        style={[
          styles.title,
          {
            color: COLORS.primary,
            textAlign: 'left',
          },
        ]}
      >
        Help & Support
      </Text>

      {/* ---------- INTRODUCTION ---------- */}

      <Text
        style={[
          styles.text,
          { marginBottom: 16 },
        ]}
      >
        Need help using Dantify? Find answers to common questions
        about clinics, patients, appointments, settings, and other
        application features. If you need further assistance,
        contact our support team.
      </Text>

      {/* ---------- FAQ ---------- */}

      <Text style={styles.sectionLabel}>
        Frequently Asked Questions
      </Text>

      {FAQS.map((faq, index) => {
        const expanded = expandedFaq === index;

        return (
          <View
            key={faq.q}
            style={styles.card}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() =>
                setExpandedFaq(expanded ? null : index)
              }
              style={styles.cardHeader}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { marginBottom: 0 },
                ]}
              >
                {faq.q}
              </Text>

              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 20,
                  fontWeight: '700',
                }}
              >
                {expanded ? '−' : '+'}
              </Text>
            </Pressable>

            {expanded && (
              <Text
                style={[
                  styles.text,
                  { marginBottom: 0 },
                ]}
              >
                {faq.a}
              </Text>
            )}
          </View>
        );
      })}

      {/* ---------- CONTACT SUPPORT ---------- */}

      <Text
        style={[
          styles.sectionLabel,
          { marginTop: 12 },
        ]}
      >
        Contact Support
      </Text>

      <View style={styles.card}>
        <Text style={styles.text}>
          For technical issues, feature requests, or general
          questions about Dantify, contact the support team.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => void contactSupport()}
          style={{ alignSelf: 'flex-start' }}
        >
          <Text style={styles.link}>
            support@dantify.app
          </Text>
        </Pressable>
      </View>

      {/* ---------- FOOTER ---------- */}

      <Text
        style={[
          styles.mutedText,
          { marginTop: 12 },
        ]}
      >
        Dantify · Version 1.0
      </Text>
    </ScrollView>
  );
}
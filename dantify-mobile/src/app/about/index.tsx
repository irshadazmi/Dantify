// src/app/about/index.tsx

import React from 'react';
import {
  Image,
  ScrollView,
  View,
} from 'react-native';

import { useStyles } from '@/styles/styles';
import { AppText } from '@/components/ui/app-text';

/* ======================================================
   ABOUT – DANTIFY
====================================================== */

export default function Index() {
  const styles = useStyles();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ---------- LOGO ---------- */}
      <Image
        source={require('@/assets/images/dantify-logo.png')}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel="Dantify logo"
      />

      {/* ---------- INTRODUCTION ---------- */}
      <View>
        <AppText
          variant="title"
          style={{ textAlign: 'center' }}
        >
          Dantify
        </AppText>

        <AppText
          variant="muted"
          style={{ textAlign: 'center', marginBottom: 16 }}
        >
          Smart Dental Practice Management System
        </AppText>
      </View>

      {/* ---------- DESCRIPTION ---------- */}
      <AppText style={styles.text}>
        Dantify is a modern, cloud-ready dental practice
        management platform designed to simplify daily clinic
        operations and enhance patient care. It brings together
        appointments, patient records, billing, and AI-assisted
        insights into a single, intuitive experience.
      </AppText>

      <AppText style={styles.text}>
        Built for clinics, dentists, and patients, Dantify
        focuses on clarity, speed, and reliability — allowing
        dental professionals to spend less time on administration
        and more time delivering quality treatment.
      </AppText>

      {/* ---------- KEY CAPABILITIES ---------- */}
      <View style={styles.card}>
        <AppText variant="legend">
          Key Capabilities
        </AppText>

        <AppText style={styles.text}>
          {'\u2022'} Patient & Clinic Profile Management{' \n'}
          {'\u2022'} Appointment Scheduling & Tracking{' \n'}
          {'\u2022'} Secure Medical & Treatment Records{' \n'}
          {'\u2022'} Payments & Billing Management{' \n'}
          {'\u2022'} AI-powered Assistance & Insights{' \n'}
          {'\u2022'} Role-based Access for Clinics & Patients
        </AppText>
      </View>

      {/* ---------- AI SECTION ---------- */}
      <View style={styles.card}>
        <AppText variant="legend">
          AI-Powered Experience
        </AppText>

        <AppText style={styles.text}>
          Dantify integrates AI to support smarter
          decision-making — from conversational assistance to
          intelligent insights on patient history, appointments,
          and operational patterns.
        </AppText>

        <AppText style={styles.text}>
          The goal is not automation for its own sake, but
          meaningful support that improves efficiency, accuracy,
          and patient engagement.
        </AppText>
      </View>

      {/* ---------- VISION ---------- */}
      <View style={styles.card}>
        <AppText variant="legend">
          Our Vision
        </AppText>

        <AppText style={styles.text}>
          To modernize dental practice management by combining
          thoughtful design, secure technology, and AI-driven
          intelligence — making high-quality dental care more
          accessible, organized, and human-centric.
        </AppText>
      </View>

      {/* ---------- FOOTER ---------- */}
      <AppText
        variant="muted"
        style={{
          marginTop: 16,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        © {new Date().getFullYear()} Dantify. All rights reserved.
      </AppText>
    </ScrollView>
  );
}
// mobile-app/src/styles/styles.ts
import { StyleSheet } from "react-native";
import { getColors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";

export const useStyles = () => {
  const { resolvedMode } = useTheme();
  const COLORS = getColors(resolvedMode);

  const SURFACE = COLORS.surface;
  const SURFACE_SOFT = COLORS.background;
  const OVERLAY = COLORS.cardShadow;
  const SKELETON = COLORS.skeleton;
  const CHIP_BG = COLORS.card;
  const BAR_BG = COLORS.disabled;

  return StyleSheet.create({
    /* ========== LAYOUT ========== */
    root: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
      backgroundColor: SURFACE_SOFT,
    },

    appContainer: {
      flex: 1,
    },

    content: {
      flex: 1,
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    container: {
      flex: 1,
      padding: 10,
      backgroundColor: SURFACE_SOFT,
      marginTop: 0,
      textAlign: "left"
    },
    contentContainer: {
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    formContainer: {
      flex: 1,
      padding: 10,
      paddingBottom: 120,
      backgroundColor: SURFACE_SOFT,
    },

    /* ========== TEXT ========== */
    welcome: {
      fontSize: 26,
      fontWeight: "700",
      color: COLORS.primary,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom: 10,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom: 10,
      textAlign: "center",
    },
    description: {
      fontSize: 16,
      marginBottom: 8,
      color: COLORS.textSecondary,
      textAlign: "center",
    },
    text: {
      fontSize: 16,
      color: COLORS.textSecondary,
      marginVertical: 8,
      lineHeight: 24,
    },
    link: {
      color: COLORS.primary,
      textDecorationLine: "underline",
      textAlign: "center",
    },
    label: {
      fontSize: 14,
      marginTop: 8,
      paddingBottom: 10,
      color: COLORS.text,
    },
    mutedText: {
      fontSize: 13,
      color: COLORS.textMuted,
      textAlign: "center",
    },
    errorText: {
      fontSize: 12,
      fontWeight: "500",
      color: COLORS.danger,
      marginBottom: 4,
    },

    /* ========== MEDIA ========== */
    image: {
      width: 240,
      height: 240,
      marginBottom: 0,
      alignSelf: "center",
    },
    logo: {
      width: 280,
      height: 280,
    },

    /* ========== INPUTS ========== */
    textInput: {
      height: 46,
      minHeight: 46,
      borderColor: COLORS.primary,
      borderWidth: 1.5,
      borderRadius: 6,
      paddingHorizontal: 10,
      backgroundColor: COLORS.card,
      color: COLORS.text,
      fontSize: 16,
      marginBottom: 10,
      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    dateInput: {
      height: 46,
      minHeight: 46,
      borderColor: COLORS.primary,
      borderWidth: 1.5,
      borderRadius: 6,
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: COLORS.card,
      justifyContent: "center",
      color: COLORS.text,
      fontSize: 16,
      marginBottom: 10,
      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    dateText: {
      color: COLORS.text,
      fontSize: 16,
    },

    /* ========== BUTTONS ========== */

    button: {
      minHeight: 46,
      backgroundColor: COLORS.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginVertical: 10,

      alignItems: "center",
      justifyContent: "center",

      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },

    circularButton: {
      backgroundColor: COLORS.primary,
      width: 48,
      height: 48,
      borderRadius: 24,

      alignItems: "center",
      justifyContent: "center",

      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },

    smallButton: {
      minHeight: 46,
      backgroundColor: COLORS.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,

      alignItems: "center",
      justifyContent: "center",

      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      elevation: 1,
    },

    otpButton: {
      backgroundColor: COLORS.primary,
      height: 48,
      minWidth: 88,
      paddingHorizontal: 12,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,

      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },

    disabledButton: {
      backgroundColor: COLORS.disabled,

      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      elevation: 1,
    },

    buttonText: {
      color: COLORS.badgeText,
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.4,
    },

    smallButtonText: {
      color: COLORS.badgeText,
      fontSize: 14,
      fontWeight: "600",
    },

    disabledButtonText: {
      color: COLORS.badgeText,
      opacity: 0.7,
      fontSize: 14,
      fontWeight: "600",
    },

    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    phoneInput: {
      flex: 1,
      minWidth: 0,
    },

    /* ========== DROPDOWN & PICKER ========== */
    dropdownWrapper: {
      height: 46,
      minHeight: 46,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      backgroundColor: COLORS.card,
      borderRadius: 6,
      paddingHorizontal: 10,
      justifyContent: "center",
      marginBottom: 10,
      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    dropdown: {
      borderWidth: 0,
      margin: 0,
      padding: 0,
      backgroundColor: "transparent",
    },
    dropdownText: {
      fontSize: 12,
      color: COLORS.text,
    },
    picker: {
      height: 46,
      width: "100%",
      color: COLORS.text,
    },

    /* ========== SCREEN HEADER ========== */
    screenHeader: {
      flexDirection: 'column',
      alignItems: 'stretch',
      marginBottom: 14,
      gap: 6,
    },
    screenHeaderContent: {
      flex: 1,
      minWidth: 0,
    },
    screenHeaderTitleRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    screenHeaderBackButton: {
      minHeight: 34,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: COLORS.primary,
      borderRadius: 8,
      backgroundColor: COLORS.card,
      flexShrink: 0,
    },
    screenHeaderBackText: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.primary,
    },

    serviceDetails: {
      flexDirection: 'row',
      gap: 28,
      marginTop: 10,
      marginBottom: 8,
    },
    serviceDetailItem: {
      gap: 3,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    listContent: {
      paddingBottom: 30,
    },
    errorContainer: {
      padding: 10,
      marginBottom: 10,
      gap: 6,
    },

    /* ========== HEADER ========== */
    headerContainer: {
      width: "100%",
      height: 56,
      backgroundColor: COLORS.primary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
    },
    headerText: {
      color: COLORS.badgeText,
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: 1,
    },

    /* ========== LIST / TABLE ========== */
    listHeader: {
      height: 46,
      flexDirection: "row",
      paddingVertical: 8,
      paddingHorizontal: 4,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.primary,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    listHeaderText: {
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "right",
      color: COLORS.badgeText,
    },
    listRow: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 4,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      backgroundColor: SURFACE,
    },
    listRowAlt: {
      backgroundColor: COLORS.lightGray,
    },

    /* ========== RADIO BUTTONS ========== */
    radioGroup: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginVertical: 8,
    },
    radioOption: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
      marginBottom: 8,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: COLORS.textSecondary,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.card,
    },
    radioOuterSelected: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: COLORS.badgeText,
    },
    radioLabel: {
      marginLeft: 6,
      fontSize: 14,
      color: COLORS.textSecondary,
    },
    radioLabelSelected: {
      color: COLORS.primary,
      fontWeight: "600",
    },

    /* ========== GENERIC CARD ========== */
    card: {
      backgroundColor: SURFACE,
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
      elevation: 2,
      shadowColor: OVERLAY,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },

    dashboardBadgeContainer: {
      alignSelf: "center",
      backgroundColor: COLORS.primary,
      paddingHorizontal: 20,
      paddingVertical: 6,
      borderRadius: 25,
      marginBottom: 15,
    },
    dashboardBadgeText: {
      fontSize: 16,
      color: COLORS.badgeText,
      fontWeight: "700",
    },

    /* ========== FEEDBACK LIST / FORMS ========== */
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 12,
      backgroundColor: COLORS.card,
      color: COLORS.text,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
      color: COLORS.textSecondary,
    },
    chipsContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },

    chip: {
      height: 30,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.primary,
      backgroundColor: CHIP_BG,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 6,
      marginBottom: 4,
      shadowColor: COLORS.cardShadow,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    chipSelected: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: COLORS.primary,
      letterSpacing: 0.5,
    },
    chipLabel: {
      marginRight: 6,
      marginBottom: 12,
      fontSize: 14,
      fontWeight: "700",
      color: COLORS.textSecondary,
    },
    chipTextSelected: {
      color: COLORS.badgeText,
      fontWeight: "700",
    },

    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      flex: 1,
      marginRight: 8,
      color: COLORS.text,
    },

    settingsDescription: {
      marginTop: 4,
      marginBottom: 8,
      lineHeight: 16,
    },

    settingsThemeOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: COLORS.secondary,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "700",
      color: COLORS.textSecondary,
    },
    issueType: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 4,
      color: COLORS.textSecondary,
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    metaText: {
      fontSize: 11,
      color: COLORS.textSecondary,
    },
    replyBox: {
      backgroundColor: SURFACE_SOFT,
      borderRadius: 8,
      padding: 8,
      marginBottom: 8,
    },
    replyLabel: {
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 2,
      color: COLORS.textSecondary,
    },
    replyText: {
      fontSize: 12,
      color: COLORS.text,
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 8,
    } as any,
    actionButton: {
      minHeight: 46,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      marginLeft: 8,
    },
    actionButtonText: {
      fontSize: 12,
      color: COLORS.badgeText,
      fontWeight: "600",
    },
    editButton: {
      backgroundColor: COLORS.blue,
    },
    deleteButton: {
      backgroundColor: COLORS.danger,
    },
    replyButton: {
      backgroundColor: COLORS.success,
    },


    /* ========== BOOKING REVIEW ========== */

    bookingReviewScrollContent: {
      paddingBottom: 32,
    },

    bookingReviewCentered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },

    bookingReviewCard: {
      backgroundColor: SURFACE,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      padding: 16,
      marginTop: 18,
    },

    bookingReviewSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 12,
    },

    bookingReviewDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 11,
      gap: 16,
    },

    bookingReviewDetailRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.border,
    },

    bookingReviewDetailLabel: {
      flex: 0.8,
      fontSize: 13,
      color: COLORS.textMuted,
    },

    bookingReviewDetailValue: {
      flex: 1.2,
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.text,
      textAlign: 'right',
    },

    bookingReviewServiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.border,
    },

    bookingReviewServiceInfo: {
      flex: 1,
    },

    bookingReviewServiceName: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.text,
    },

    bookingReviewServiceMeta: {
      fontSize: 12,
      color: COLORS.textMuted,
      marginTop: 5,
    },

    bookingReviewServicePrice: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.text,
    },

    bookingReviewTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      marginTop: 8,
      paddingTop: 14,
    },

    bookingReviewTotalLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.text,
    },

    bookingReviewTotalAmount: {
      fontSize: 20,
      fontWeight: '800',
      color: COLORS.primary,
    },

    bookingReviewDisclaimer: {
      fontSize: 11,
      color: COLORS.textMuted,
      marginTop: 10,
      lineHeight: 16,
    },

    bookingReviewNotes: {
      fontSize: 14,
      color: COLORS.text,
      lineHeight: 21,
    },

    bookingReviewNotice: {
      backgroundColor: SURFACE_SOFT,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      padding: 13,
      marginTop: 18,
    },

    bookingReviewNoticeText: {
      fontSize: 13,
      color: COLORS.text,
      lineHeight: 19,
    },

    bookingReviewPrimaryButton: {
      minHeight: 50,
      borderRadius: 9,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      marginTop: 22,
    },

    bookingReviewPrimaryButtonText: {
      color: COLORS.badgeText,
      fontSize: 15,
      fontWeight: '700',
    },

    bookingReviewButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    bookingReviewBackButton: {
      alignItems: 'center',
      paddingVertical: 16,
    },

    bookingReviewBackButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.primary,
    },


    /* ========== BOOKING AUTHENTICATION ========== */

    bookingAuthScrollContent: {
      flexGrow: 1,
      paddingBottom: 28,
    },

    bookingAuthCentered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },

    bookingAuthHeader: {
      alignItems: 'center',
      paddingTop: 28,
      paddingBottom: 20,
    },

    bookingAuthBrand: {
      fontSize: 26,
      fontWeight: '800',
      color: COLORS.primary,
      marginBottom: 20,
    },

    bookingAuthCard: {
      backgroundColor: SURFACE,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      padding: 18,
      marginTop: 16,
    },

    bookingAuthCardTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 8,
    },

    bookingAuthSecondaryButton: {
      minHeight: 48,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      marginTop: 18,
    },

    bookingAuthSecondaryButtonText: {
      color: COLORS.primary,
      fontSize: 15,
      fontWeight: '700',
    },

    bookingAuthNotice: {
      backgroundColor: SURFACE_SOFT,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 20,
    },

    bookingAuthNoticeText: {
      color: COLORS.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },

    bookingAuthBackButton: {
      alignItems: 'center',
      paddingVertical: 18,
      marginTop: 4,
    },

    bookingAuthBackButtonText: {
      color: COLORS.primary,
      fontSize: 14,
      fontWeight: '600',
    },

    /* ========== BOOKING CONFIRMATION ========== */

    confirmationContent: {
      paddingHorizontal: 12,
      paddingTop: 20,
      paddingBottom: 40,
    },

    confirmationCenter: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },

    confirmationLoadingText: {
      marginTop: 14,
      fontSize: 14,
      color: COLORS.textSecondary,
    },

    confirmationHero: {
      alignItems: 'center',
      paddingVertical: 20,
      marginBottom: 12,
    },

    confirmationSuccessIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: COLORS.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },

    confirmationSuccessIconText: {
      fontSize: 42,
      fontWeight: '700',
      color: COLORS.badgeText,
    },

    confirmationTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: COLORS.text,
      textAlign: 'center',
      marginBottom: 8,
    },

    confirmationSubtitle: {
      fontSize: 14,
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },

    confirmationReference: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 14,
    },

    confirmationReferenceLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: COLORS.textMuted,
      marginBottom: 5,
    },

    confirmationReferenceValue: {
      fontSize: 23,
      fontWeight: '800',
      color: COLORS.primary,
    },

    confirmationCard: {
      backgroundColor: SURFACE,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 16,
      marginBottom: 14,
    },

    confirmationSectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 14,
    },

    confirmationDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 14,
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.border,
    },

    confirmationDetailLabel: {
      flex: 1,
      fontSize: 13,
      color: COLORS.textMuted,
    },

    confirmationDetailValue: {
      flex: 1.5,
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.text,
      textAlign: 'right',
    },

    confirmationServiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.border,
    },

    confirmationServiceInfo: {
      flex: 1,
    },

    confirmationServiceName: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.text,
    },

    confirmationServiceQuantity: {
      fontSize: 12,
      color: COLORS.textMuted,
      marginTop: 4,
    },

    confirmationServicePrice: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.text,
    },

    confirmationTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      marginTop: 4,
    },

    confirmationTotalLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: COLORS.text,
    },

    confirmationTotalValue: {
      fontSize: 19,
      fontWeight: '800',
      color: COLORS.primary,
    },

    confirmationEmptyText: {
      fontSize: 13,
      color: COLORS.textMuted,
    },

    confirmationNotes: {
      fontSize: 14,
      color: COLORS.textSecondary,
      lineHeight: 21,
    },

    confirmationFooter: {
      alignItems: 'center',
      paddingTop: 8,
    },

    confirmationFooterText: {
      fontSize: 13,
      color: COLORS.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 8,
    },

    confirmationErrorTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: COLORS.text,
      textAlign: 'center',
      marginBottom: 10,
    },

    confirmationErrorText: {
      fontSize: 14,
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 18,
    },

    confirmationSecondaryButton: {
      minHeight: 46,
      borderWidth: 1,
      borderColor: COLORS.primary,
      borderRadius: 8,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },

    confirmationSecondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.primary,
    },

    /* ========== UNIFIED STATUS BADGES ========== */
    statusPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
      borderWidth: 1,
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.2,
    },

    statusPillSuccess: {
      backgroundColor: COLORS.card,
      borderColor: COLORS.success,
    },
    statusPillTextSuccess: {
      color: COLORS.success,
    },

    statusPillWarning: {
      backgroundColor: COLORS.card,
      borderColor: COLORS.warning,
    },
    statusPillTextWarning: {
      color: COLORS.warning,
    },

    statusPillDanger: {
      backgroundColor: COLORS.card,
      borderColor: COLORS.danger,
    },
    statusPillTextDanger: {
      color: COLORS.danger,
    },

    statusPillInfo: {
      backgroundColor: COLORS.card,
      borderColor: COLORS.blue,
    },
    statusPillTextInfo: {
      color: COLORS.blue,
    },

    statusPillNeutral: {
      backgroundColor: COLORS.card,
      borderColor: COLORS.textSecondary,
    },
    statusPillTextNeutral: {
      color: COLORS.textSecondary,
    },


    /* ========== TAB BAR ========== */

    tabBarContainer: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-around",

      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COLORS.tabBorderTop,

      paddingTop: 6,
      paddingBottom: 6,
      paddingHorizontal: 4,

      backgroundColor: COLORS.tabBg,

      shadowColor: COLORS.cardShadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 10,
    },

    tabBarItem: {
      flex: 1,
      minWidth: 0,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 2,
      gap: 3,
    },

    tabBarIconWrapper: {
      width: 28,
      height: 26,
      alignItems: "center",
      justifyContent: "center",
    },

    tabBarLabel: {
      fontSize: 11,
      textAlign: "center",
      maxWidth: "100%",
    },

    tabBarBadge: {
      position: "absolute",
      top: -4,
      right: -8,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      alignItems: "center",
      justifyContent: "center",
    },

    tabBarBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      textAlign: "center",
    },

    tabBarPressed: {
      opacity: 0.65,
    },

    /* ========== CUSTOM DRAWER ========== */

    drawerOverlay: {
      ...StyleSheet.absoluteFill,
      flexDirection: "row",
      zIndex: 1000,
      elevation: 10,
    },

    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },

    drawerContainer: {
      width: 280,
      maxWidth: "85%",
      height: "100%",
      backgroundColor: SURFACE,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: COLORS.border,
      elevation: 12,
    },

    drawerHeader: {
      minHeight: 64,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.border,
    },

    drawerHeaderTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: COLORS.text,
    },

    drawerCloseButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },

    drawerCloseText: {
      fontSize: 30,
      lineHeight: 32,
      fontWeight: "300",
      color: COLORS.text,
    },

    drawerItemsContainer: {
      paddingVertical: 12,
      paddingHorizontal: 10,
      paddingBottom: 28,
    },

    drawerItem: {
      minHeight: 46,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      marginVertical: 2,
      borderRadius: 8,
      gap: 12,
    },

    drawerIconContainer: {
      width: 24,
      alignItems: "center",
      justifyContent: "center",
    },

    drawerItemText: {
      flex: 1,
      fontSize: 14,
      color: COLORS.text,
    },

    drawerItemActive: {
      backgroundColor: COLORS.tabBg,
    },

    drawerItemTextActive: {
      color: COLORS.tabActive,
      fontWeight: "600",
    },

    drawerItemPressed: {
      opacity: 0.7,
    },

    /* ========== DENTIST PROFILE ========== */
    profileScroll: {
      flex: 1,
      backgroundColor: SURFACE_SOFT,
    },
    profileScrollContent: {
      padding: 16,
      paddingBottom: 40,
      flexGrow: 1,
    },
    profileLoading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: SURFACE_SOFT,
      gap: 12,
    },
    profileError: {
      marginBottom: 14,
    },
    profileEmptyCard: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: SURFACE,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: 'center',
    },
    profileEmptyIcon: {
      fontSize: 42,
      marginBottom: 12,
    },
    profileEmptyTitle: {
      fontWeight: '700',
      marginBottom: 8,
      color: COLORS.text,
    },
    profileEmptyDescription: {
      color: COLORS.textMuted,
      textAlign: 'center',
      marginBottom: 18,
    },
    profileCard: {
      padding: 20,
      borderRadius: 18,
      backgroundColor: SURFACE,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    profileAvatarSection: {
      alignItems: 'center',
      marginBottom: 20,
    },
    profileAvatar: {
      width: 112,
      height: 112,
      borderRadius: 56,
      overflow: 'hidden',
      backgroundColor: SURFACE_SOFT,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileAvatarImage: {
      width: 112,
      height: 112,
    },
    profileAvatarPlaceholder: {
      fontSize: 42,
    },
    profileName: {
      marginTop: 12,
      marginBottom: 0,
      textAlign: 'center',
    },
    profileSpecialization: {
      color: COLORS.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    profileInfoList: {
      gap: 14,
    },
    profileInfoItem: {
      gap: 4,
    },
    profileInfoLabel: {
      color: COLORS.textMuted,
      fontSize: 12,
    },
    profileEditButton: {
      marginTop: 24,
    },
    profileDeleteButton: {
      marginTop: 12,
      backgroundColor: COLORS.danger,
    },
    profileActionDisabled: {
      opacity: 0.6,
    },
    profileFormScrollContent: {
      padding: 10,
      paddingBottom: 48,
      flexGrow: 1,
    },
    profileFormError: {
      marginBottom: 12,
    },

    /* ========== DASHBOARD ========== */
    dashboardHeaderContainer: {
      padding: 10,
      width: "100%",
      backgroundColor: SURFACE_SOFT,
    },
    dashboardCardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    dashboardUsageBox: {
      marginTop: 16,
      marginBottom: 8,
    },
    barBg: {
      height: 10,
      backgroundColor: BAR_BG,
      borderRadius: 10,
      marginTop: 6,
      overflow: "hidden",
    },
    barBgSmall: {
      height: 6,
      backgroundColor: BAR_BG,
      borderRadius: 6,
      marginTop: 4,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 10,
      backgroundColor: COLORS.primary,
    },
    dashboardChartBox: {
      marginTop: 20,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: SURFACE,
      paddingVertical: 12,
      paddingHorizontal: 4,
      elevation: 2,
      shadowColor: OVERLAY,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
    },
    dashboardChartTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 10,
      paddingHorizontal: 12,
      color: COLORS.text,
    },
    dashboardSection: {
      marginTop: 16,
      paddingHorizontal: 4,
    },
    dashboardCategoryRow: {
      marginTop: 10,
    },
    dashboardCategoryTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.text,
    },

    /* ========== SKELETONS ========== */
    skeletonBox: {
      borderRadius: 12,
      backgroundColor: COLORS.background,
      marginVertical: 8,
      opacity: 0.6,
    },
    skeleton: {
      borderRadius: 12,
      backgroundColor: SKELETON,
      marginVertical: 8,
      opacity: 0.4,
    },

    /* ========== TRANSACTIONS ========== */
    txnRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
      borderBottomWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.card,
    },
    txnTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: COLORS.text,
    },
    txnAmt: {
      fontWeight: "700",
      fontSize: 14,
    },

    /* ========== GENERIC NUMBERS ========== */
    value: {
      marginTop: 4,
      fontSize: 18,
      fontWeight: "700",
    },
    subValue: {
      fontSize: 12,
      opacity: 0.7,
    },

    /* ========== MISC ========== */
    chartSurface: {
      backgroundColor: SURFACE,
    },
    usageLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    /* ========== SETTINGS ========== */

    settingsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },

    settingsHeaderTitle: {
      flex: 1,
      textAlign: "left",
      marginBottom: 0,
    },

    settingsToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    settingsToggleText: {
      flex: 1,
    },

    settingsCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    settingsLoadingText: {
      marginTop: 12,
    },

    settingsFooter: {
      textAlign: "center",
      marginTop: 20,
      marginBottom: 8,
    },
  });
};

export const ROOT_CONTAINER_STYLE = StyleSheet.create({
  root: {
    flex: 1,
  },
}).root;

/**
 * Public patient landing page.
 * Uses the shared Dantify theme tokens for both light and dark mode.
 */
export const usePublicLandingStyles = () => {
  const { resolvedMode } = useTheme();
  const COLORS = getColors(resolvedMode);

  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 22 },

    /* Brand header */
    brandHeader: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 13,
    },
    brandBlock: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 9 },
    brandLogo: { width: 48, height: 48, flexShrink: 0 },
    brandCopy: { flex: 1, minWidth: 0, justifyContent: "center" },
    brandName: { color: COLORS.text, fontSize: 23, lineHeight: 27, fontWeight: "800", letterSpacing: -0.5 },
    brandTagline: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 15 },
    locationChip: {
      maxWidth: "48%",
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
    },
    locationCopy: { flexShrink: 1, minWidth: 0, gap: 1 },
    locationCaption: { color: COLORS.textMuted, fontSize: 10, lineHeight: 13 },
    locationValue: { color: COLORS.text, fontSize: 13, lineHeight: 17, fontWeight: "700" },

    /* Hero */
    heroRow: {
      minHeight: 116,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 2,
      marginBottom: 8,
    },
    heroCopy: { flex: 1, minWidth: 0, justifyContent: "center", paddingRight: 0 },
    heroTitle: { color: COLORS.text, fontSize: 24, lineHeight: 29, fontWeight: "800", letterSpacing: -0.6, marginBottom: 5 },
    heroSubtitle: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
    heroArtwork: { width: 116, height: 112, flexShrink: 0, marginRight: -4 },

    /* Search */
    searchCard: {
      // The reusable PublicSearchBar already has its own outline.
      // Keep this wrapper only for spacing so the search control has one border.
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderWidth: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
    },
    searchInputRow: { minHeight: 43, flexDirection: "row", alignItems: "center", gap: 9 },
    searchInput: { flex: 1, minWidth: 0, color: COLORS.text, fontSize: 14, paddingVertical: 8 },
    searchActionDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: COLORS.border },
    voiceButton: { minWidth: 31, minHeight: 36, alignItems: "center", justifyContent: "center" },
    searchHint: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },

    /* Sections */
    section: { paddingTop: 19 },
    sectionHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 11 },
    sectionTitle: { color: COLORS.text, fontSize: 17, lineHeight: 22, fontWeight: "700", letterSpacing: -0.2 },
    sectionSubtitle: { color: COLORS.textMuted, fontSize: 11, lineHeight: 15, marginTop: 2 },
    viewAll: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
    nearbyHeading: { flex: 1, minWidth: 0 },

    /* Specializations */
    specializationsRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    specializationCard: {
      flex: 1,
      minWidth: 0,
      minHeight: 77,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingHorizontal: 3,
      paddingVertical: 10,
      borderRadius: 13,
      backgroundColor: COLORS.backgroundElement,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    specializationLabel: { color: COLORS.text, fontSize: 10, lineHeight: 13, fontWeight: "600", textAlign: "center" },
    pressedCard: { opacity: 0.78, transform: [{ scale: 0.985 }] },

    /* Dentist cards */
    recommendedSection: { paddingBottom: 8 },
    loadingRow: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 4 },
    mutedText: { color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },
    dentistCard: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
      marginBottom: 9,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 15,
      backgroundColor: COLORS.surface,
    },
    dentistAvatar: {
      width: 58,
      height: 58,
      flexShrink: 0,
      overflow: "hidden",
      borderRadius: 13,
      backgroundColor: COLORS.backgroundElement,
      alignItems: "center",
      justifyContent: "center",
    },
    dentistPhoto: { width: "100%", height: "100%", borderRadius: 13 },
    dentistInfo: { flex: 1, minWidth: 0, gap: 3 },
    dentistName: { color: COLORS.text, fontSize: 14, lineHeight: 18, fontWeight: "700" },
    dentistSpecialty: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 15 },
    dentistLocationRow: { flexDirection: "row", alignItems: "center", gap: 3, minWidth: 0 },
    dentistLocation: { flex: 1, color: COLORS.textMuted, fontSize: 10, lineHeight: 14 },
    profileAction: { flexDirection: "row", alignItems: "center", gap: 1, paddingLeft: 2 },
    profileActionText: { color: COLORS.primary, fontSize: 11, fontWeight: "700" },
    emptyDentists: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 15,
      backgroundColor: COLORS.surface,
    },
    emptyIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.backgroundElement },
    emptyDentistsText: { flex: 1, minWidth: 0, gap: 3 },
    emptyTitle: { color: COLORS.text, fontSize: 12, lineHeight: 16, fontWeight: "700" },

    /* Guest bottom navigation */
    bottomBar: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: COLORS.tabBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COLORS.tabBorderTop,
      paddingTop: 5,
      paddingBottom: 2,
    },
    tabItem: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 4 },
    tabLabel: { color: COLORS.tabInactive, fontSize: 10, fontWeight: "500" },
    tabLabelActive: { color: COLORS.tabActive, fontSize: 10, fontWeight: "700" },
    tabPressed: { opacity: 0.65 },

    /* Location modal */
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.58)", justifyContent: "center", padding: 22 },
    locationModal: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 18, gap: 10 },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
    locationInput: { minHeight: 46, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text, backgroundColor: COLORS.card, fontSize: 15, marginTop: 5 },
    searchButton: { minHeight: 46, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginTop: 5, paddingHorizontal: 14 },
    searchButtonText: { color: COLORS.badgeText, fontSize: 14, fontWeight: "700" },
  });
};

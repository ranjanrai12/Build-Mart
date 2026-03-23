import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';

const FAQS = [
  { q: "How do I track my delivery?", a: "You can track your delivery in real-time from the 'My Orders' section by clicking on any active order." },
  { q: "What is your return policy?", a: "We accept returns for unused and undamaged materials within 7 days of delivery. Custom cut materials cannot be returned." },
  { q: "Do you supply bulk orders?", a: "Yes, we specialize in bulk orders. Contact our support team for special wholesale pricing and dedicated logistics." },
];

export default function HelpSupportScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.subText}>Our support team is available Mon-Sat, 9AM to 7PM.</Text>
          
          <TouchableOpacity style={styles.contactRow}>
            <View style={styles.iconCircle}><MaterialIcons name="call" size={20} color={COLORS.accent} /></View>
            <View>
              <Text style={styles.contactLabel}>Call Us</Text>
              <Text style={styles.contactValue}>1800-123-BUILD</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.contactRow}>
            <View style={styles.iconCircle}><MaterialIcons name="email" size={20} color={COLORS.accent} /></View>
            <View>
              <Text style={styles.contactLabel}>Email Us</Text>
              <Text style={styles.contactValue}>support@buildmart.com</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginLeft: 8, marginTop: SIZES.lg, marginBottom: 12 }]}>Frequently Asked Questions</Text>
        {FAQS.map((faq, index) => (
          <View key={index} style={styles.faqCard}>
            <View style={styles.qRow}>
              <MaterialIcons name="help-outline" size={20} color={COLORS.primary} />
              <Text style={styles.question}>{faq.q}</Text>
            </View>
            <Text style={styles.answer}>{faq.a}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.header,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20, paddingHorizontal: SIZES.base,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    ...SHADOWS.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, ...FONTS.bold, color: COLORS.white },
  content: { padding: SIZES.base, paddingBottom: 40 },
  contactCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 20, ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  subText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: SIZES.md },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,107,53,0.1)', alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 12, color: COLORS.textMuted },
  contactValue: { fontSize: 15, ...FONTS.semiBold, color: COLORS.textPrimary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SIZES.sm },
  faqCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SIZES.base, marginBottom: SIZES.sm, ...SHADOWS.sm,
  },
  qRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  question: { flex: 1, fontSize: 14, ...FONTS.bold, color: COLORS.textPrimary, lineHeight: 20 },
  answer: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, paddingLeft: 28 },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, RADIUS, SHADOWS } from '../../../constants/theme';

export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About BuildMart</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoBox}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="domain" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>BuildMart</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.desc}>
            BuildMart is the premier B2B marketplace connecting contractors and builders with verified suppliers of top-grade construction materials. Our mission is to streamline procurement, ensure pricing transparency, and guarantee timely logistics.
          </Text>
        </View>

        <View style={styles.linksCard}>
          {[
            { label: 'Terms of Service', icon: 'assignment' },
            { label: 'Privacy Policy', icon: 'privacy-tip' },
            { label: 'Open Source Licenses', icon: 'code' },
          ].map((item, idx) => (
            <TouchableOpacity key={item.label} style={[styles.linkRow, idx > 0 && styles.linkBorder]}>
              <MaterialIcons name={item.icon} size={20} color={COLORS.textSecondary} />
              <Text style={styles.linkLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.copyright}>© 2026 BuildMart Inc. All rights reserved.</Text>
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
  content: { padding: SIZES.base, paddingTop: 30 },
  logoBox: { alignItems: 'center', marginBottom: 30 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.md,
    ...SHADOWS.md,
  },
  appName: { fontSize: 24, ...FONTS.extraBold, color: COLORS.textPrimary },
  version: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 20, marginBottom: SIZES.md, ...SHADOWS.sm,
  },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, textAlign: 'center' },
  linksCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    marginBottom: SIZES.xl, ...SHADOWS.sm, overflow: 'hidden',
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  linkBorder: { borderTopWidth: 1, borderTopColor: COLORS.divider },
  linkLabel: { flex: 1, fontSize: 15, ...FONTS.semiBold, color: COLORS.textPrimary },
  copyright: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginBottom: 40 },
});

import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView 
} from 'react-native';
import { 
  ChevronLeft, MoreVertical, CheckCircle2, 
  Wallet, CreditCard, Plus, ShieldCheck 
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';

export default function PaymentMethodsScreen({ onBack }) {
  return (
    <View style={styles.container}>
      {/* 1. Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ChevronLeft size={24} color={COLORS.textHeader} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2. Saved Methods */}
        <Text style={styles.sectionLabel}>SAVED METHODS</Text>

        {/* Easypaisa Card */}
        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Wallet size={24} color={COLORS.primary} />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>DEFAULT</Text>
            </View>
            <TouchableOpacity style={styles.moreBtn}>
              <MoreVertical size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.methodName}>Easypaisa</Text>
            <Text style={styles.methodDetail}>03xx-xxxx567</Text>
            <View style={styles.statusRow}>
              <CheckCircle2 size={14} color="#10B981" />
              <Text style={styles.statusText}>Verified Account</Text>
            </View>
          </View>
        </View>

        {/* PayPal Card */}
        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, {backgroundColor: '#EBF5FF'}]}>
              <CreditCard size={24} color="#0070BA" />
            </View>
            <TouchableOpacity style={[styles.moreBtn, {marginLeft: 'auto'}]}>
              <MoreVertical size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.methodName}>PayPal</Text>
            <Text style={styles.methodDetail}>p***l@email.com</Text>
            <Text style={[styles.statusText, {marginLeft: 0, marginTop: 4}]}>Expires 2028</Text>
          </View>
        </View>

        {/* 3. Add New Method (Dashed) */}
        <TouchableOpacity style={styles.addCardDashed}>
          <View style={styles.addBtnCircle}>
            <Plus size={24} color="#FFF" />
          </View>
          <Text style={styles.addBtnText}>Add New Method</Text>
        </TouchableOpacity>

        {/* 4. Security Note */}
        <View style={styles.securityBox}>
          <ShieldCheck size={20} color={COLORS.textSecondary} />
          <View style={styles.securityTextContent}>
            <Text style={styles.securityTitle}>Secure Payments</Text>
            <Text style={styles.securityDesc}>
              Aapka data 2026-standard financial gateways ke zariye encrypted hai. 
              Full credit card details kabhi server par store nahi ki jatien.
            </Text>
          </View>
        </View>
        
        <Text style={styles.complianceText}>PCI-DSS Level 1 Certified</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backText: { fontSize: 16, color: COLORS.textHeader, marginLeft: 5, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textHeader },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 15, letterSpacing: 1 },
  
  paymentCard: { 
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconBox: { width: 45, height: 45, backgroundColor: COLORS.accent, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 12 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  moreBtn: { padding: 5 },
  
  cardInfo: { marginTop: 5 },
  methodName: { fontSize: 18, fontWeight: '700', color: COLORS.textHeader },
  methodDetail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 5 },
  
  addCardDashed: { 
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', 
    borderRadius: 20, padding: 25, alignItems: 'center', justifyContent: 'center', marginTop: 10 
  },
  addBtnCircle: { width: 40, height: 40, backgroundColor: COLORS.primary, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  addBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },

  securityBox: { flexDirection: 'row', marginTop: 40, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16 },
  securityTextContent: { flex: 1, marginLeft: 12 },
  securityTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textHeader, marginBottom: 4 },
  securityDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  complianceText: { textAlign: 'center', fontSize: 11, color: COLORS.border, marginTop: 20, fontWeight: '600' }
});
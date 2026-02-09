import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
export default function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.logoText}>AI Image Studio <Text style={{color: COLORS.primary}}>Pro</Text></Text>
      <View style={styles.creditBadge}>
        <Zap size={14} color={COLORS.primary} fill={COLORS.primary} />
        <Text style={styles.creditText}>12 Credits</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10
  },
  logoText: { fontSize: 18, fontWeight: '800', color: COLORS.textHeader },
  creditBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.accent, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  creditText: { color: COLORS.primary, fontWeight: '700', fontSize: 12, marginLeft: 4 }
});
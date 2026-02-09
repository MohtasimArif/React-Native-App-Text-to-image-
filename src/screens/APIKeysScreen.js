import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Clipboard, 
  Alert, 
  Platform, 
  ActivityIndicator 
} from 'react-native';
import { ChevronLeft, Plus, Copy, ShieldAlert } from 'lucide-react-native';

export default function APIKeysScreen({ onBack, colors = {} }) {
  // Safe Fallback Colors taake crash na ho
  const theme = {
    primary: colors?.primary || '#6366f1',
    background: colors?.background || '#FFFFFF',
    surface: colors?.surface || '#F3F4F6',
    textHeader: colors?.textHeader || '#111827',
    textSecondary: colors?.textSecondary || '#6B7280',
    border: colors?.border || '#E5E7EB',
    accent: colors?.accent || '#EEF2FF',
  };

  const [keys, setKeys] = useState([
    { id: '1', name: 'Production - Main', key: 'sk-••••••••1234', date: 'Oct 12, 2025' },
    { id: '2', name: 'Staging Environment', key: 'sk-••••••••8890', date: 'Dec 05, 2025' },
  ]);

  const copyToClipboard = (key) => {
    Clipboard.setString(key);
    Alert.alert('Copied!', 'API Key copied to clipboard.');
  };

  const SkeletonRow = () => (
    <View style={[styles.skeletonRow, { backgroundColor: theme.surface }]}>
      <View style={[styles.skeletonTextLarge, { backgroundColor: theme.border }]} />
      <View style={[styles.skeletonTextSmall, { backgroundColor: theme.border }]} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ChevronLeft size={24} color={theme.textHeader} />
          <Text style={[styles.headerTitle, { color: theme.textHeader }]}>API Keys</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={[styles.helpLink, { color: theme.primary }]}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={[styles.mainHeading, { color: theme.textHeader }]}>Developer Credentials</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Manage your API keys to integrate AI Image Studio Pro into your own applications and workflows.
          </Text>
        </View>

        {/* Generate Button */}
        <TouchableOpacity style={[styles.generateBtn, { backgroundColor: theme.primary }]}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.generateBtnText}>Generate New Key</Text>
        </TouchableOpacity>

        {/* Active Keys */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ACTIVE KEYS</Text>
        {keys.map((item) => (
          <View key={item.id} style={[styles.keyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.keyName, { color: theme.textHeader }]}>{item.name}</Text>
              <Text style={[styles.keyMasked, { color: theme.textSecondary }]}>{item.key}</Text>
              <Text style={styles.keyDate}>Created: {item.date}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.copyBtn, { backgroundColor: theme.accent }]} 
              onPress={() => copyToClipboard(item.key)}
            >
              <Copy size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Skeleton Loaders */}
        <View style={styles.syncSection}>
          <SkeletonRow />
          <SkeletonRow />
        </View>

        {/* Security Note */}
        <View style={[styles.securityBox, { backgroundColor: theme.primary }]}>
          <View style={styles.securityHeader}>
            <ShieldAlert size={18} color="#FFF" />
            <Text style={styles.securityTitle}>Security Note</Text>
          </View>
          <Text style={styles.securityMessage}>
            Never share your API keys or expose them in client-side code. If a key is compromised, revoke it immediately and generate a new one.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 15, 
    borderBottomWidth: 1 
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
  helpLink: { fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  introSection: { marginBottom: 25 },
  mainHeading: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 20 },
  generateBtn: { 
    flexDirection: 'row', height: 55, borderRadius: 16, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 30 
  },
  generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginLeft: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 15, letterSpacing: 1 },
  keyCard: { 
    borderRadius: 16, padding: 15, flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderWidth: 1
  },
  keyName: { fontSize: 15, fontWeight: '700' },
  keyMasked: { fontSize: 13, marginVertical: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  keyDate: { fontSize: 11, color: '#9CA3AF' },
  copyBtn: { padding: 10, borderRadius: 10, marginLeft: 10 },
  syncSection: { opacity: 0.5 },
  skeletonRow: { height: 65, borderRadius: 16, marginBottom: 15, padding: 15, justifyContent: 'center' },
  skeletonTextLarge: { width: '60%', height: 12, borderRadius: 6, marginBottom: 8 },
  skeletonTextSmall: { width: '40%', height: 8, borderRadius: 4 },
  securityBox: { borderRadius: 20, padding: 20, marginTop: 20 },
  securityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  securityTitle: { color: '#FFF', fontWeight: '800', fontSize: 16, marginLeft: 10 },
  securityMessage: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18 }
});
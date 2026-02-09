import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Lock, CheckCircle, Circle } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

// --- SUPABASE IMPORT ---
import { supabase } from '../../supabaseConfig'; 

const CheckItem = ({ label, active }) => (
  <View style={styles.checkItemRow}>
    {active ? (
      <CheckCircle size={14} color="#10B981" />
    ) : (
      <Circle size={14} color={COLORS.border} />
    )}
    <Text style={[styles.checkText, active && { color: COLORS.textHeader }]}>
      {label}
    </Text>
  </View>
);

export default function SignupScreen({ onSwitchToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const checks = {
    length: password.length >= 8,
    number: /\d/.test(password),
    symbol: /[@$!%*?&]/.test(password),
    upper: /[A-Z]/.test(password),
  };

  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordSecure = Object.values(checks).every(check => check === true);

  // --- REAL SUPABASE SIGNUP FUNCTION ---
  const handleSignupPress = async () => {
    if (!fullName) return Alert.alert("Error", "Please enter your full name");
    if (!isEmailValid) return Alert.alert("Error", "Please enter a valid email");
    if (!isPasswordSecure) return Alert.alert("Error", "Password must meet all requirements");

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName, // Saving name in user metadata
          }
        }
      });

      if (error) {
        Alert.alert("Signup Failed", error.message);
      } else {
        // Agar email confirmation ON hai, toh user ko batana hoga
        const message = data.session 
          ? `Welcome ${fullName}! Your account is ready.`
          : "Please check your email for the confirmation link.";
        
        Alert.alert("Success", message, [
          { text: "OK", onPress: () => onSwitchToLogin() }
        ]);
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.primary, '#9D5BFF']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the future of AI creativity</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputWrapper}>
              <User size={20} color={COLORS.textSecondary} style={styles.icon} />
              <TextInput 
                placeholder="Full Name"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Mail size={20} color={COLORS.textSecondary} style={styles.icon} />
              <TextInput 
                placeholder="Email Address"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {isEmailValid && <CheckCircle size={18} color="#10B981" />}
            </View>

            <View style={[styles.inputWrapper, {marginBottom: 10}]}>
              <Lock size={20} color={COLORS.textSecondary} style={styles.icon} />
              <TextInput 
                placeholder="Password"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.checklist}>
              <CheckItem label="8+ characters" active={checks.length} />
              <CheckItem label="One number" active={checks.number} />
              <CheckItem label="Special symbol" active={checks.symbol} />
              <CheckItem label="Uppercase letter" active={checks.upper} />
            </View>

            <TouchableOpacity 
              style={[styles.signupBtn, (loading || !fullName || !isEmailValid) && {opacity: 0.7}]} 
              onPress={handleSignupPress}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.signupBtnText}>Get Started</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={onSwitchToLogin}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={{fontWeight: '800', color: COLORS.primary}}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ... Styles remains exactly as you provided ...
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25, paddingTop: 60 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  formCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 25, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface, 
    borderRadius: 16, 
    paddingHorizontal: 15, 
    marginBottom: 15, 
    height: 55, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.textHeader, fontSize: 16 },
  checklist: { marginBottom: 20, marginTop: 5 },
  checkItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checkText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 8 },
  signupBtn: { 
    backgroundColor: COLORS.primary, 
    height: 55, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10 
  },
  signupBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  loginLink: { marginTop: 25, alignItems: 'center' },
  loginLinkText: { color: COLORS.textSecondary, fontSize: 14 }
});
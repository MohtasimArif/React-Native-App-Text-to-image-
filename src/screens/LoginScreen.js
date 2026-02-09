import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Chrome, Facebook } from 'lucide-react-native'; 
import { COLORS } from '../theme/colors';

// --- SUPABASE IMPORT ---
import { supabase } from '../../supabaseConfig'; 

const { height } = Dimensions.get('window');

export default function LoginScreen({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- REAL SUPABASE LOGIN FUNCTION ---
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // App.js ka onAuthStateChange isse handle kar lega, 
        // lekin hum local state ke liye onLogin call kar rahe hain
        onLogin({ 
          name: data.user.user_metadata?.full_name || email.split('@')[0], 
          email: data.user.email, 
          uid: data.user.id 
        });
        Alert.alert("Login Successful", "Welcome back to AI Image Studio Pro!");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // --- SOCIAL LOGIN (Placeholder for Supabase OAuth) ---
  const handleSocialLogin = async (platform) => {
    Alert.alert("Coming Soon", `${platform} login is being configured in Supabase dashboard.`);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={[COLORS.primary, '#9D5BFF']} style={styles.gradientHeader}>
        <Text style={styles.headerLogo}>AI Image Studio <Text style={{color: '#FFF'}}>Pro</Text></Text>
        <Text style={styles.headerTagline}>Visionary Creation Tool</Text>
      </LinearGradient>

      <View style={styles.loginCard}>
        <Text style={styles.welcomeText}>Welcome Back!</Text>

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
        </View>

        <View style={styles.inputWrapper}>
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.signInBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.signInBtnText}>Sign In</Text>}
        </TouchableOpacity>

        <Text style={styles.orContinue}>OR CONTINUE WITH</Text>

        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={styles.socialBtn} 
            onPress={() => handleSocialLogin('Google')}
            disabled={loading}
          >
            <Chrome size={24} color={COLORS.textHeader} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialBtn} 
            onPress={() => handleSocialLogin('Facebook')}
            disabled={loading}
          >
            <Facebook size={24} color="#1877F2" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signUpPrompt} onPress={onSwitchToSignup} disabled={loading}>
            <Text style={styles.signUpText}>Don't have an account? <Text style={{fontWeight: '700', color: COLORS.primary}}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradientHeader: { height: height * 0.35, justifyContent: 'center', alignItems: 'center' },
  headerLogo: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  headerTagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  loginCard: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, marginTop: -30, flex: 1, alignItems: 'center' },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.textHeader, marginBottom: 30 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, height: 55, width: '100%' },
  icon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.textHeader, fontSize: 16 },
  errorText: { color: '#F43F5E', textAlign: 'center', marginBottom: 15, paddingHorizontal: 10 },
  signInBtn: { backgroundColor: COLORS.primary, height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 10 },
  signInBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  orContinue: { color: COLORS.textSecondary, marginVertical: 20, fontSize: 12, fontWeight: '600' },
  socialButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '50%' },
  socialBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  signUpPrompt: { marginTop: 25 },
  signUpText: { color: COLORS.textSecondary, fontSize: 14 }
});
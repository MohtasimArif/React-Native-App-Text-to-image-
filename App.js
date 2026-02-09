import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// --- SUPABASE IMPORT ---
import { supabase } from './supabaseConfig'; 

// Icons Import
import { 
  Sparkles, 
  Search, 
  Layout, 
  Settings as SettingsIcon 
} from 'lucide-react-native';

// Screens Import
import SplashScreen from './src/screens/SplashScreen'; // Naya Import
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import StudioScreen from './src/screens/StudioScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import PersonalInformationScreen from './src/screens/PersonalInformationScreen';
import APIKeysScreen from './src/screens/APIKeysScreen'; 

export default function App() {
  const [isShowSplash, setIsShowSplash] = useState(true); // Splash state
  const [isReady, setIsReady] = useState(false); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Studio');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settingsView, setSettingsView] = useState('main'); 

  // --- SUPABASE AUTH LISTENER ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        updateUserInfo(session.user);
        setIsLoggedIn(true);
      }
      setIsReady(true);
    };

    // Splash khatam hone ke baad session check karein (Better UX)
    if (!isShowSplash) {
      checkSession();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        updateUserInfo(session.user);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isShowSplash]);

  const updateUserInfo = (supabaseUser) => {
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || 'User',
      profileImage: supabaseUser.user_metadata?.avatar_url || null,
    });
  };

  // Dynamic Theme Object
  const theme = {
    primary: '#582CFF',
    background: isDarkMode ? '#121212' : '#F8F9FF',
    surface: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    textHeader: isDarkMode ? '#FFFFFF' : '#111827',
    textSecondary: isDarkMode ? '#A0A0A0' : '#6B7280',
    border: isDarkMode ? '#333333' : '#E5E7EB',
    accent: isDarkMode ? '#2A2A2A' : '#F3F0FF',
    navBg: isDarkMode ? '#1A1A1A' : '#FFFFFF',
  };

  // Handlers
  const handleLogin = async () => { 
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      updateUserInfo(session.user);
      setIsLoggedIn(true); 
    }
  };

  const handleSignup = async () => { 
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      updateUserInfo(session.user);
      setIsLoggedIn(true); 
    }
  };
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setIsLoggedIn(false);
      setUser(null);
      setAuthMode('login');
      setActiveTab('Studio');
      setSettingsView('main');
    } catch (error) {
      Alert.alert('Logout Error', error.message);
    }
  };

  const handleUpdateUser = (updatedData) => { 
    setUser(prev => ({ ...prev, ...updatedData })); 
  };

  const renderContent = () => {
    // 1. Sabse pehle Splash Screen dikhayenge
    if (isShowSplash) {
      return <SplashScreen onFinish={() => setIsShowSplash(false)} />;
    }

    // 2. Phir Session loading state
    if (!isReady) {
      return (
        <View style={[styles.center, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    // 3. Phir Auth Logic
    if (!isLoggedIn) {
      return authMode === 'login' ? (
        <LoginScreen 
          onLogin={handleLogin} 
          onSwitchToSignup={() => setAuthMode('signup')} 
        />
      ) : (
        <SignupScreen 
          onSignup={handleSignup} 
          onSwitchToLogin={() => setAuthMode('login')} 
        />
      );
    }

    // 4. Main App
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        
        <View style={{ flex: 1 }}>
          <View style={styles.content}>
            {activeTab === 'Studio' && <StudioScreen user={user} theme={theme} />}
            {activeTab === 'Discover' && <DiscoverScreen theme={theme} />}
            {activeTab === 'Library' && <LibraryScreen user={user} theme={theme} />}
            
            {activeTab === 'Settings' && (
              <>
                {settingsView === 'main' && (
                  <SettingsScreen 
                    user={user} 
                    colors={theme} 
                    isDarkMode={isDarkMode}
                    setIsDarkMode={(val) => setIsDarkMode(val)}
                    onLogout={handleLogout} 
                    onNavigate={(target) => {
                      if (target === 'Payments') setSettingsView('payments');
                      if (target === 'PersonalInformation' || target === 'Profile') setSettingsView('profile');
                      if (target === 'API') setSettingsView('api_keys');
                      if (target === 'Studio') setActiveTab('Studio');
                    }}
                  />
                )}
                {settingsView === 'payments' && <PaymentMethodsScreen theme={theme} onBack={() => setSettingsView('main')} />}
                {settingsView === 'profile' && (
                  <PersonalInformationScreen 
                    user={user} 
                    theme={theme} 
                    onBack={() => setSettingsView('main')} 
                    onUpdateUser={handleUpdateUser} 
                  />
                )}
                {settingsView === 'api_keys' && <APIKeysScreen theme={theme} onBack={() => setSettingsView('main')} />}
              </>
            )}
          </View>

          {/* Bottom Nav */}
          <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.border }]}>
            {[
              { id: 'Studio', icon: Sparkles },
              { id: 'Discover', icon: Search },
              { id: 'Library', icon: Layout },
              { id: 'Settings', icon: SettingsIcon },
            ].map((tab) => (
              <TouchableOpacity 
                key={tab.id} 
                style={styles.navItem} 
                activeOpacity={0.7}
                onPress={() => { 
                  setActiveTab(tab.id); 
                  setSettingsView('main'); 
                }}
              >
                <tab.icon size={24} color={activeTab === tab.id ? theme.primary : theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaProvider>
      {renderContent()}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingBottom: 75 },
  bottomNav: { 
    flexDirection: 'row', 
    width: '100%', 
    height: 75, 
    borderTopWidth: 1, 
    justifyContent: 'space-around', 
    alignItems: 'center',
    paddingBottom: 10,
    position: 'absolute',
    bottom: 0
  },
  navItem: { padding: 15 }
});
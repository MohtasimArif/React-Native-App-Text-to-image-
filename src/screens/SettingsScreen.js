import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image as RNImage, Switch, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { 
  User, Key, Zap, Moon, LogOut, ChevronRight, Camera 
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
// Legacy import for Expo SDK 54+ stability
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

// Supabase config import
import { supabase } from '../../supabaseConfig'; 

export default function SettingsScreen({ 
  user, 
  onLogout, 
  onNavigate, 
  colors, 
  isDarkMode, 
  setIsDarkMode 
}) {
  const [isTurbo, setIsTurbo] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || 'Creative User');
  const [avatarUrl, setAvatarUrl] = useState(user?.profileImage || null);

  const getProfile = useCallback(async () => {
    try {
      // Direct session fetch for maximum reliability
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || user?.id;

      if (!currentUserId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setDisplayName(data.full_name || user?.name || 'Creative User');
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.log('Error loading profile:', error.message);
    }
  }, [user?.id, user?.name]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is needed to change profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || user?.id;

      if (!currentUserId) throw new Error("User session not found.");

      const fileExt = uri.split('.').pop().toLowerCase();
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
      
      // Convert to Base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64', 
      });

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64), {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. Database Update (profiles table)
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: currentUserId, 
          avatar_url: publicUrl, 
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      
      // 4. Update Auth Metadata (to sync with App.js user object)
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      setAvatarUrl(publicUrl);
      Alert.alert('Success', 'Profile picture updated!');

    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert('Update Failed', error.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const SettingRow = ({ icon: Icon, title, subtitle, value, isRed, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accent }, isRed && { backgroundColor: '#FFF1F2' }]}>
          <Icon size={20} color={isRed ? '#F43F5E' : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.textHeader }, isRed && { color: '#F43F5E' }]}>{title}</Text>
          {subtitle && <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>}
        <ChevronRight size={18} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const profilePicSource = avatarUrl 
    ? { uri: avatarUrl } 
    : { uri: `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=582CFF&color=fff` };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer} disabled={uploading}>
            <RNImage source={profilePicSource} style={styles.avatar} />
            {uploading ? (
              <View style={styles.loaderOverlay}><ActivityIndicator color="#FFF" /></View>
            ) : (
              <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                <Camera size={10} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.nameSection}>
            <Text style={[styles.displayName, { color: colors.textHeader }]}>{displayName}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.doneBtn, { backgroundColor: colors.accent }]} 
          onPress={() => onNavigate('Studio')}
        >
          <Text style={[styles.doneText, { color: colors.textHeader }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow 
            icon={User} 
            title="Personal Information" 
            subtitle="Update name & profile info"
            onPress={() => onNavigate('PersonalInformation')} 
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon={Key} title="API Keys" value="Active" onPress={() => onNavigate('API')} />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SYSTEM</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.controlRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}><Zap size={20} color={colors.primary} /></View>
              <Text style={[styles.rowTitle, { color: colors.textHeader }]}>Turbo Generation</Text>
            </View>
            <Switch value={isTurbo} onValueChange={setIsTurbo} trackColor={{ false: colors.border, true: colors.primary }} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.controlRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}><Moon size={20} color={colors.primary} /></View>
              <Text style={[styles.rowTitle, { color: colors.textHeader }]}>Dark Mode</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: colors.border, true: colors.primary }} />
          </View>
        </View>

        <View style={[styles.card, { marginTop: 10, backgroundColor: colors.surface }]}>
          <SettingRow icon={LogOut} title="Sign Out" isRed onPress={onLogout} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EEE' },
  loaderOverlay: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  proBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  nameSection: { marginLeft: 15 },
  displayName: { fontSize: 20, fontWeight: '800' },
  email: { fontSize: 13 },
  doneBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  doneText: { fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 10, marginLeft: 5, letterSpacing: 1 },
  card: { borderRadius: 20, padding: 15, marginBottom: 25 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { fontSize: 14, marginRight: 8 },
  divider: { height: 1, marginVertical: 5 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }
});
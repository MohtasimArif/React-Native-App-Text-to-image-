import React, { useState, useEffect } from 'react'; // Added useEffect
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  Image as RNImage, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy'; 
import { decode } from 'base64-arraybuffer';
import { ChevronLeft, Camera, User, Mail } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { supabase } from '../../supabaseConfig'; 

export default function PersonalInformationScreen({ user, onBack, onUpdateUser }) {
  // Local states
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || ''); 
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [loading, setLoading] = useState(false);

  // FIX: Ye hook ensure karega ke jab bhi parent se naya user data aaye, 
  // inputs automatically update ho jayein aur purana name cache na rahe.
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  const pickImage = async () => {
    if (loading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Hamein gallery access chahiye.');
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Picker Error:", error);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Session expired. Please login again.');
      return;
    }

    try {
      setLoading(true);
      let finalImageUrl = profileImage;

      // 1. Image Upload Logic
      if (profileImage && (profileImage.startsWith('file') || profileImage.startsWith('content'))) {
        const fileExt = profileImage.split('.').pop().toLowerCase();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const base64 = await FileSystem.readAsStringAsync(profileImage, {
          encoding: 'base64', 
        });

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(base64), {
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrl;
      }

      // 2. Database Update Logic
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: trimmedName,
          avatar_url: finalImageUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // 3. UI Sync - Parent state ko naye data ke sath update karna
      if (onUpdateUser) {
        onUpdateUser({ 
          ...user, 
          name: trimmedName, 
          profileImage: finalImageUrl 
        });
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => onBack() } // Success ke baad hi wapas jayein
      ]);

    } catch (error) {
      console.error("Update Error:", error);
      const msg = error.code === '42501' 
        ? "Permission Denied: Database policies are blocking the update." 
        : error.message;
      Alert.alert('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} disabled={loading}>
          <ChevronLeft size={24} color={COLORS.primary || '#582CFF'} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Personal Information</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity activeOpacity={0.7} onPress={pickImage} style={styles.avatarContainer} disabled={loading}>
              <View style={styles.avatarWrapper}>
                <RNImage 
                  source={profileImage ? { uri: profileImage } : { uri: `https://ui-avatars.com/api/?name=${name || 'User'}&background=582CFF&color=fff` }} 
                  style={styles.avatar} 
                />
                <View style={styles.cameraBadge}><Camera size={16} color="#FFF" /></View>
              </View>
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#888" style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  value={name} 
                  onChangeText={setName} 
                  placeholder="Enter your name" 
                  placeholderTextColor="#AAA" 
                  editable={!loading} 
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, { backgroundColor: '#F5F5F5' }]}>
                <Mail size={20} color="#AAA" style={styles.icon} />
                <TextInput style={[styles.input, { color: '#AAA' }]} value={email} editable={false} />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: COLORS.primary || '#582CFF' }, loading && { opacity: 0.7 }]} 
            onPress={handleSave} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { paddingHorizontal: 20, paddingTop: 50, marginBottom: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backText: { fontSize: 16, color: '#582CFF', marginLeft: 5, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#000', marginTop: 5 },
  scrollContent: { paddingHorizontal: 25, alignItems: 'center', paddingTop: 20, paddingBottom: 40 },
  photoSection: { alignItems: 'center', marginBottom: 30, width: '100%' },
  avatarContainer: { alignItems: 'center', justifyContent: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#EEE' },
  cameraBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#582CFF', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#FFF' },
  changePhotoText: { color: '#582CFF', fontWeight: '700', fontSize: 15, marginTop: 5 },
  form: { width: '100%', marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 16, paddingHorizontal: 15, height: 58, borderWidth: 1, borderColor: '#EEE' },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#000', fontWeight: '500' },
  saveBtn: { width: '100%', height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' }
});
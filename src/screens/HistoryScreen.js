import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, ActivityIndicator, Dimensions, 
  StatusBar, RefreshControl, Modal 
} from 'react-native';
import { supabase } from '../../supabaseConfig';
import { Clock, Download, X, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 25;

export default function HistoryScreen({ theme }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // --- GET DATA ---
  const fetchHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('generated_images_of_moh_dev')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDownload = async (uri) => {
    try {
      const base64Code = uri.includes('base64,') ? uri.split('base64,')[1] : uri;
      const filename = `AI_Studio_History_${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64Code, { encoding: FileSystem.EncodingType.Base64 });
      await MediaLibrary.saveToLibraryAsync(fileUri);
      alert("Saved to Gallery! ✨");
    } catch (err) {
      alert("Download failed");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => setSelectedImage(item)}
    >
      <Image source={{ uri: item.image_url }} style={styles.thumb} />
      <View style={styles.cardOverlay}>
        <Text numberOfLines={1} style={styles.promptLabel}>{item.prompt}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textHeader }]}>My Gallery</Text>
        <Text style={[styles.subTitle, { color: theme.textSecondary }]}>{history.length} Creations</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchHistory();}} tintColor={theme.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ImageIcon size={50} color={theme.border} />
              <Text style={{ color: theme.textSecondary, marginTop: 10 }}>No masterpieces yet!</Text>
            </View>
          }
        />
      )}

      {/* Preview Modal */}
      <Modal visible={!!selectedImage} transparent animationType="slide">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
            <X color="#FFF" size={30} />
          </TouchableOpacity>
          {selectedImage && (
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedImage.image_url }} style={styles.fullImg} resizeMode="contain" />
              <View style={styles.modalInfo}>
                <Text style={styles.modalPrompt}>"{selectedImage.prompt}"</Text>
                <TouchableOpacity 
                  style={[styles.downloadBtn, { backgroundColor: theme.primary }]}
                  onPress={() => handleDownload(selectedImage.image_url)}
                >
                  <Download size={20} color="#FFF" />
                  <Text style={styles.downloadText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { paddingHorizontal: 25, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subTitle: { fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: 15, paddingBottom: 100 },
  card: { width: COLUMN_WIDTH, height: 220, margin: 8, borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  thumb: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', padding: 10 },
  promptLabel: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', marginTop: 100 },
  modalBg: { flex: 1, backgroundColor: '#000' },
  closeBtn: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
  modalContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullImg: { width: '95%', height: '70%', borderRadius: 30 },
  modalInfo: { width: '90%', marginTop: 20, alignItems: 'center' },
  modalPrompt: { color: '#FFF', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  downloadBtn: { flexDirection: 'row', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20, alignItems: 'center' },
  downloadText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10 }
});
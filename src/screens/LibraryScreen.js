import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image as RNImage, Dimensions, Modal, Alert, TextInput,
  Share, Platform, ActivityIndicator
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { 
  Search, Folder, X, Download, Trash2, Share2, Heart, ChevronLeft, FolderPlus
} from 'lucide-react-native';

import { supabase } from '../../supabaseConfig'; 

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

export default function LibraryScreen({ colors = {} }) {
  // Forced Light Mode Logic
  const isDark = false; // System setting ko ignore kar diya

  const theme = {
    primary: colors?.primary || '#007AFF',
    background: colors?.background || '#FFFFFF',
    surface: colors?.surface || '#F2F2F7',
    textHeader: colors?.textHeader || '#000000',
    textSecondary: colors?.textSecondary || '#8E8E93',
    border: colors?.border || '#C6C6C8',
    accent: colors?.accent || '#E5E7EB'
  };

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('Generations');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isPreviewVisible, setPreviewVisible] = useState(false);
  const [isFolderModalVisible, setFolderModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');

  const [allAssets, setAllAssets] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('generated_images_of_moh_dev') 
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllAssets(data || []);
    } catch (error) {
      console.error("Fetch Error:", error.message);
      Alert.alert('Error', 'Could not sync with the database.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (item) => {
    if (!item) return;
    const newFavStatus = !item.is_favorite;
    try {
      const { error } = await supabase
        .from('generated_images_of_moh_dev')
        .update({ is_favorite: newFavStatus })
        .eq('id', item.id);

      if (error) throw error;
      
      setAllAssets(prev => prev.map(a => a.id === item.id ? { ...a, is_favorite: newFavStatus } : a));
      if (selectedImage?.id === item.id) {
        setSelectedImage(prev => ({ ...prev, is_favorite: newFavStatus }));
      }
    } catch (error) {
      Alert.alert('Error', "Failed to update favorite status");
    }
  };

  const moveImageToFolder = async (folderName) => {
    if (!selectedImage || !folderName.trim()) {
        Alert.alert("Input Required", "Please enter or select a folder name.");
        return;
    }
    try {
      const { error } = await supabase
        .from('generated_images_of_moh_dev')
        .update({ folder_name: folderName.trim() })
        .eq('id', selectedImage.id);

      if (error) throw error;
      
      setAllAssets(prev => prev.map(a => a.id === selectedImage.id ? { ...a, folder_name: folderName.trim() } : a));
      Alert.alert("Success", `Moved to ${folderName}`);
      setFolderModalVisible(false);
      setNewFolderName('');
    } catch (error) {
      Alert.alert("Error", "Could not move image");
    }
  };

  const handleDeleteAsset = async (id) => {
    Alert.alert("Delete Image", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const { error } = await supabase.from('generated_images_of_moh_dev').delete().eq('id', id);
          if (!error) {
            setAllAssets(prev => prev.filter(item => item.id !== id));
            setPreviewVisible(false);
          } else {
            Alert.alert("Error", "Failed to delete image.");
          }
      }}
    ]);
  };

  const downloadImage = async (imageUrl) => {
    if (!imageUrl) return;
    setDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "We need access to your gallery.");
        return;
      }
      const fileUri = FileSystem.documentDirectory + `AI_Studio_${Date.now()}.jpg`;
      const downloadRes = await FileSystem.downloadAsync(imageUrl, fileUri);
      const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
      await MediaLibrary.createAlbumAsync("AI-Studio", asset, false);
      Alert.alert("Success", "Saved to Gallery!");
    } catch (error) {
      Alert.alert("Error", "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async (imgUrl) => {
    try {
      await Share.share({ 
        url: Platform.OS === 'ios' ? imgUrl : '', 
        message: `Check out my AI creation! ${imgUrl}` 
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share image');
    }
  };

  const folders = useMemo(() => {
    const uniqueFolders = [...new Set(allAssets.map(a => a.folder_name).filter(Boolean))];
    return uniqueFolders;
  }, [allAssets]);

  const displayedAssets = useMemo(() => {
    return allAssets.filter(asset => {
      const matchesSearch = (asset.prompt || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === 'Favorites') return asset.is_favorite && matchesSearch;
      if (activeTab === 'Collections') {
        if (!currentFolder) return false;
        return asset.folder_name === currentFolder && matchesSearch;
      }
      return matchesSearch;
    });
  }, [activeTab, allAssets, searchQuery, currentFolder]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={[styles.searchBarWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={18} color={theme.textSecondary} />
          <TextInput 
            placeholder="Search your library..." 
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.textHeader }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
        {['Generations', 'Favorites', 'Collections'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => { setActiveTab(tab); setCurrentFolder(null); }} 
            style={[styles.tab, activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textSecondary }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'Collections' && !currentFolder && (
          <View style={styles.folderRow}>
            {folders.length > 0 ? folders.map((folderName, index) => (
              <TouchableOpacity key={index} style={[styles.folderCard, { backgroundColor: theme.surface }]} onPress={() => setCurrentFolder(folderName)}>
                <Folder size={32} color={theme.primary} fill={`${theme.primary}33`} />
                <Text style={[styles.folderTitle, { color: theme.textHeader }]} numberOfLines={1}>{folderName}</Text>
              </TouchableOpacity>
            )) : (
              <View style={styles.centeredView}>
                <FolderPlus size={48} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No collections found. Organize your art by moving images to folders.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Collections' && currentFolder && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentFolder(null)}>
            <ChevronLeft size={20} color={theme.primary} />
            <Text style={[styles.backBtnText, { color: theme.primary }]}>Back to Collections / {currentFolder}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.assetGrid}>
          {displayedAssets.length > 0 ? displayedAssets.map((asset) => (
            <TouchableOpacity 
              key={asset.id} 
              onPress={() => { setSelectedImage(asset); setPreviewVisible(true); }}
              style={[styles.assetCard, { backgroundColor: theme.surface }]}
            >
              <RNImage source={{ uri: asset.image_url }} style={styles.assetImg} />
              {asset.is_favorite && (
                 <View style={styles.favBadge}><Heart size={12} color="#FFF" fill="#FFF" /></View>
              )}
              <View style={styles.assetInfo}>
                <Text style={[styles.assetName, { color: theme.textHeader }]} numberOfLines={1}>{asset.prompt || 'Untitled Artwork'}</Text>
              </View>
            </TouchableOpacity>
          )) : (
            (activeTab !== 'Collections' || currentFolder) && (
              <View style={styles.centeredView}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No matching creations found.</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Image Preview Modal - Optimized for Light Mode */}
      <Modal visible={isPreviewVisible} animationType="fade" transparent={false}>
        <View style={[styles.previewContainer, { backgroundColor: '#F8F9FA' }]}>
            <View style={styles.previewHeader}>
                <TouchableOpacity onPress={() => setPreviewVisible(false)} style={styles.closeBtn}>
                    <X size={28} color="#000" />
                </TouchableOpacity>
                <View style={styles.previewActions}>
                    <TouchableOpacity onPress={() => setFolderModalVisible(true)} style={styles.iconBtn}>
                        <FolderPlus size={26} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleFavorite(selectedImage)} style={styles.iconBtn}>
                        <Heart size={26} color={selectedImage?.is_favorite ? "#FF3B30" : "#000"} fill={selectedImage?.is_favorite ? "#FF3B30" : "transparent"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleShare(selectedImage?.image_url)} style={styles.iconBtn}>
                        <Share2 size={26} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAsset(selectedImage?.id)} style={styles.iconBtn}>
                        <Trash2 size={26} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>

            <RNImage source={{uri: selectedImage?.image_url}} style={styles.fullImage} resizeMode="contain" />

            <View style={[styles.previewFooter, { backgroundColor: '#FFFFFF' }]}>
                <Text style={[styles.fullImageName, { color: '#000' }]}>{selectedImage?.prompt}</Text>
                <TouchableOpacity 
                  style={[styles.downloadBtn, { backgroundColor: theme.primary }]} 
                  onPress={() => downloadImage(selectedImage?.image_url)}
                  disabled={downloading}
                >
                    {downloading ? <ActivityIndicator color="#FFF" /> : (
                      <>
                        <Download size={20} color="#FFF" />
                        <Text style={styles.downloadBtnText}>Download to Gallery</Text>
                      </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Move to Folder Modal */}
      <Modal visible={isFolderModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: '#000' }]}>Organize Image</Text>
            
            <TextInput 
              style={[styles.folderInput, { color: '#000', borderBottomColor: '#DDD' }]}
              placeholder="New collection name..."
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={[styles.createBtn, { backgroundColor: theme.primary }]} 
              onPress={() => moveImageToFolder(newFolderName)}
            >
              <Text style={styles.createBtnText}>Move to Folder</Text>
            </TouchableOpacity>

            {folders.length > 0 && (
                <>
                <Text style={[styles.divider, { color: '#888' }]}>EXISTING COLLECTIONS</Text>
                <ScrollView style={{maxHeight: 200}}>
                {folders.map((f, i) => (
                    <TouchableOpacity key={i} style={[styles.folderSelectItem, { borderBottomColor: '#EEE' }]} onPress={() => moveImageToFolder(f)}>
                    <Folder size={18} color={theme.primary} />
                    <Text style={[styles.folderSelectText, { color: '#000' }]}>{f}</Text>
                    </TouchableOpacity>
                ))}
                </ScrollView>
                </>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setFolderModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { paddingHorizontal: 20, marginBottom: 15 },
  searchBarWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 15, height: 50, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, marginBottom: 15 },
  tab: { paddingVertical: 12, marginRight: 25 },
  tabText: { fontSize: 15, fontWeight: '600' },
  folderRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15 },
  folderCard: { width: '45%', borderRadius: 20, padding: 25, margin: '2.5%', alignItems: 'center' },
  folderTitle: { marginTop: 10, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  assetGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, justifyContent: 'space-between' },
  assetCard: { width: COLUMN_WIDTH, marginVertical: 8, marginHorizontal: 5, borderRadius: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  assetImg: { width: '100%', height: 220 },
  favBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 12 },
  assetInfo: { padding: 12 },
  assetName: { fontSize: 12, fontWeight: '600' },
  centeredView: { flex: 1, width: width - 40, alignItems: 'center', marginTop: 60, alignSelf: 'center' },
  emptyText: { textAlign: 'center', fontSize: 15, marginTop: 15, paddingHorizontal: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  backBtnText: { fontWeight: '700', marginLeft: 8 },
  previewContainer: { flex: 1 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 30, alignItems: 'center' },
  previewActions: { flexDirection: 'row' },
  iconBtn: { marginLeft: 22 },
  closeBtn: { padding: 8 },
  fullImage: { flex: 1, width: '100%' },
  previewFooter: { padding: 30, paddingBottom: 50, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  fullImageName: { fontSize: 15, marginBottom: 25, lineHeight: 22, fontWeight: '500' },
  downloadBtn: { flexDirection: 'row', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  downloadBtnText: { color: '#FFF', fontWeight: '700', marginLeft: 12, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '88%', borderRadius: 24, padding: 30, elevation: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  folderInput: { borderBottomWidth: 1.5, paddingVertical: 10, fontSize: 17, marginBottom: 20 },
  createBtn: { padding: 15, borderRadius: 12, alignItems: 'center' },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  divider: { textAlign: 'center', marginVertical: 20, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  folderSelectItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5 },
  folderSelectText: { marginLeft: 12, fontSize: 16 },
  cancelBtn: { marginTop: 25, alignItems: 'center' },
  cancelBtnText: { color: '#FF3B30', fontWeight: '600', fontSize: 15 }
});
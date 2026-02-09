import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, FlatList, 
  Image as RNImage, TouchableOpacity, Dimensions,
  StatusBar, Modal, Alert, ActivityIndicator 
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import ManageWallpaper from 'react-native-manage-wallpaper';
import { Search, X, Download, Monitor } from 'lucide-react-native'; 

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 50) / 2;
const ACCESS_KEY = 'VsXcfS8HaapN6VSXYPMqOFVtc1c77l7bt84haFdPWew';
const TAGS = ['Trending', 'Portrait', 'Nature', '3D Render', 'Architecture'];

// Memoized Image Card
const ImageCard = React.memo(({ item, onPress, theme }) => (
  <TouchableOpacity 
    activeOpacity={0.9} 
    style={[styles.imageCard, { backgroundColor: theme.surface }]}
    onPress={() => onPress(item)}
  >
    <RNImage 
      source={{ uri: item.thumb }} 
      style={styles.cardImg} 
      resizeMode="cover"
    />
    <View style={styles.cardOverlay}>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
    </View>
  </TouchableOpacity>
));

export default function DiscoverScreen({ theme }) { // theme prop receive kiya
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState('Trending');
  const [selectedImage, setSelectedImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchImages = async (isMore = false) => {
    if (isMore && loadingMore) return;
    
    if (isMore) setLoadingMore(true); 
    else {
        setLoading(true);
        setPage(1);
    }
    
    try {
      const currentPage = isMore ? page + 1 : 1;
      const finalQuery = searchQuery || selectedTag;
      const url = `https://api.unsplash.com/search/photos?page=${currentPage}&per_page=14&query=${finalQuery}&client_id=${ACCESS_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) return;

      const data = await response.json();
      const results = data.results || [];
      
      const formattedData = results.map(item => ({
        id: `${item.id}-${currentPage}`,
        title: item.alt_description || `${finalQuery} Art`,
        img: item.urls.regular, 
        thumb: item.urls.small,  
        category: finalQuery
      }));

      setImages(prev => isMore ? [...prev, ...formattedData] : formattedData);
      setPage(currentPage);
      
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [selectedTag]);

  const handleSearch = () => {
    if(searchQuery.trim().length > 0) {
      setSelectedTag('');
      fetchImages(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedImage) return;
    setDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Storage permission is required.");
        return;
      }
      const fileName = `AI_Studio_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const downloadRes = await FileSystem.downloadAsync(selectedImage.img, fileUri);
      if (downloadRes.status === 200) {
        const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
        await MediaLibrary.createAlbumAsync("AI Studio", asset, false);
        Alert.alert("Success! 🎉", "Saved to your gallery.");
      }
    } catch (error) {
      Alert.alert("Error", "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSetWallpaper = async () => {
    if (!selectedImage) return;
    setSettingWallpaper(true);
    try {
      ManageWallpaper.setWallpaper(
        { uri: selectedImage.img },
        (res) => {
          if (res.status === 'success') Alert.alert("Done! ✨", "Wallpaper applied.");
          setSettingWallpaper(false);
        },
        'home'
      );
    } catch (err) {
      setSettingWallpaper(false);
      Alert.alert("Notice", "Development Build required to Apply directly.");
    }
  };

  const renderItem = useCallback(({ item }) => (
    <ImageCard item={item} onPress={setSelectedImage} theme={theme} />
  ), [theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
      
      {/* Header & Search */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textHeader }]}>Discover</Text>
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput 
            placeholder="Search wallpapers..." 
            style={[styles.searchInput, { color: theme.textHeader }]} 
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor={theme.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {setSearchQuery(''); fetchImages();}}>
                <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tags */}
      <View style={{ height: 60 }}>
        <FlatList 
          horizontal 
          data={TAGS} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => { setSelectedTag(item); setSearchQuery(''); }}
              style={[
                styles.tag, 
                { backgroundColor: theme.surface, borderColor: theme.border },
                selectedTag === item && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
            >
              <Text style={[styles.tagText, { color: theme.textSecondary }, selectedTag === item && { color: '#FFF' }]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Main Grid */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList 
          data={images} 
          numColumns={2} 
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContainer}
          renderItem={renderItem}
          onEndReached={() => fetchImages(true)}
          onEndReachedThreshold={0.7}
          ListFooterComponent={() => loadingMore ? <ActivityIndicator style={{margin: 20}} color={theme.primary} /> : <View style={{height: 100}} />}
          removeClippedSubviews={true}
        />
      )}

      {/* Full Preview Modal */}
      <Modal visible={selectedImage !== null} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
            <X size={28} color="#FFF" />
          </TouchableOpacity>
          
          {selectedImage && (
            <View style={styles.fullContent}>
              <RNImage source={{ uri: selectedImage.img }} style={styles.fullImage} />
              <View style={styles.actionContainer}>
                <View>
                  <Text style={styles.modalTitle} numberOfLines={1}>{selectedImage.title}</Text>
                  <Text style={styles.modalSub}>{selectedImage.category.toUpperCase()}</Text>
                </View>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#333' }]} 
                    onPress={handleDownload} 
                    disabled={downloading}
                  >
                    {downloading ? <ActivityIndicator color="#FFF" /> : <><Download size={22} color="#FFF" /><Text style={styles.btnText}>Save</Text></>}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: theme.primary }]} 
                    onPress={handleSetWallpaper}
                    disabled={settingWallpaper}
                  >
                    {settingWallpaper ? <ActivityIndicator color="#FFF" /> : <><Monitor size={22} color="#FFF" /><Text style={styles.btnText}>Apply</Text></>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 15, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 16 },
  tagsList: { paddingHorizontal: 20, alignItems: 'center' },
  tag: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, marginRight: 10, borderWidth: 1 },
  tagText: { fontWeight: '700' },
  gridContainer: { paddingHorizontal: 10, paddingTop: 10 },
  loaderContainer: { flex: 1, justifyContent: 'center' },
  imageCard: { width: COLUMN_WIDTH, margin: 7, borderRadius: 20, overflow: 'hidden', height: 260, elevation: 3 },
  cardImg: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, width: '100%', padding: 12, backgroundColor: 'rgba(0,0,0,0.4)' },
  cardTitle: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  modalBackground: { flex: 1, backgroundColor: '#000' },
  closeBtn: { position: 'absolute', top: 40, right: 20, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 30 },
  fullContent: { flex: 1 },
  fullImage: { width: '100%', height: '70%', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  actionContainer: { flex: 1, padding: 25, justifyContent: 'space-between', paddingBottom: 40 },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  modalSub: { color: '#888', fontSize: 14, marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 20, gap: 8 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, ScrollView, 
  TouchableOpacity, FlatList, Image as RNImage,
  StatusBar, Dimensions, ActivityIndicator, Alert, Modal 
} from 'react-native';
import { 
  Image as ImageIcon, Zap, Clock, Sparkles, Wand2, Download, X, Trash2
} from 'lucide-react-native'; 
import { supabase } from '../../supabaseConfig'; 
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import Header from '../components/Header';

const { width } = Dimensions.get('window');

const STYLES = [
  { id: '1', name: 'Cinematic', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400' },
  { id: '2', name: 'Digital Art', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400' },
  { id: '3', name: 'Anime', img: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400' },
  { id: '4', name: '3D Render', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400' },
  { id: '5', name: 'Cyberpunk', img: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400' },
];

export default function StudioScreen({ theme, parallelTasks = 1 }) {
  const [activeStyle, setActiveStyle] = useState('2');
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState([]);
  const [completedImages, setCompletedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('generated_images_of_moh_dev')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompletedImages(data.map(item => ({
        id: item.id.toString(),
        uri: item.image_url,
        prompt: item.prompt,
        style: item.style,
        timestamp: new Date(item.created_at).toLocaleTimeString()
      })));
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveToDatabase = async (imageUrl, promptText, styleName) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('generated_images_of_moh_dev').insert([{ 
        user_id: user.id, image_url: imageUrl, prompt: promptText, style: styleName 
      }]).select();
      
      if (data && data[0]) {
        return data[0].id.toString();
      }
    } catch (err) {
      console.error("DB Save Error:", err);
    }
  };

  const handleDeleteImage = async (id) => {
    Alert.alert(
      "Delete Artwork",
      "Are you sure you want to delete this from your gallery and database?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('generated_images_of_moh_dev')
                .delete()
                .eq('id', id);

              if (error) throw error;

              setCompletedImages(prev => prev.filter(img => img.id !== id));
              setIsPreviewVisible(false);
              setSelectedImage(null);
            } catch (err) {
              Alert.alert("Error", "Could not delete the image.");
            }
          }
        }
      ]
    );
  };

  const processWithHorde = async (taskToProcess, styleName) => {
    const payload = {
      prompt: `${taskToProcess.prompt}, ${styleName} style, high quality, masterpiece`,
      params: { sampler_name: "k_euler_a", cfg_scale: 7.5, width: 512, height: 512, steps: 20 },
      models: ["stable_diffusion"]
    };

    try {
      const submitRes = await fetch("https://stablehorde.net/api/v2/generate/async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "0000000000",
          "Client-Agent": "AI-Image-Studio-Pro:1.0"
        },
        body: JSON.stringify(payload)
      });

      const { id } = await submitRes.json();
      if (!id) throw new Error("HORDE_SUBMISSION_FAILED");

      return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
            const data = await checkRes.json();
            if (data.done && data.generations?.[0]) {
              clearInterval(interval);
              resolve(data.generations[0].img);
            }
          } catch (e) {
            clearInterval(interval);
            reject(e);
          }
        }, 4000);
      });
    } catch (err) {
      throw err;
    }
  };

  const startProcessing = useCallback(async (taskToProcess, retryCount = 0) => {
    setTasks(prev => prev.map(t => t.id === taskToProcess.id ? { ...t, status: 'generating' } : t));

    const styleName = STYLES.find(s => s.id === activeStyle)?.name || 'Digital Art';
    const seed = Math.floor(Math.random() * 999999);
    const models = ['turbo', 'flux', 'stable-diffusion-xl'];
    const selectedModel = models[retryCount] || 'turbo';
    
    const fullPrompt = `${taskToProcess.prompt}, ${styleName} style, high quality, masterpiece`;
    const cleanedPrompt = fullPrompt.replace(/[^a-zA-Z0-9, ]/g, '');
    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanedPrompt)}?seed=${seed}&width=1024&height=1024&model=${selectedModel}&nologo=true`;

    try {
      const response = await fetch(pollinationUrl);
      if (response.status >= 500) throw new Error("SERVER_BUSY");
      if (!response.ok) throw new Error(`HTTP_${response.status}`);

      const dbId = await saveToDatabase(pollinationUrl, taskToProcess.prompt, styleName);

      const newImageData = {
        id: dbId || taskToProcess.id,
        uri: pollinationUrl, 
        prompt: taskToProcess.prompt,
        style: styleName,
        timestamp: new Date().toLocaleTimeString()
      };

      setCompletedImages(prev => [newImageData, ...prev]);
      setTasks(prev => prev.filter(t => t.id !== taskToProcess.id));

    } catch (error) {
      if (retryCount < 2) {
        setTimeout(() => startProcessing(taskToProcess, retryCount + 1), 3000);
      } else {
        try {
          const hordeImg = await processWithHorde(taskToProcess, styleName);
          const dbId = await saveToDatabase(hordeImg, taskToProcess.prompt, styleName);
          
          const newImageData = {
            id: dbId || taskToProcess.id,
            uri: hordeImg, 
            prompt: taskToProcess.prompt,
            style: styleName,
            timestamp: new Date().toLocaleTimeString()
          };
          setCompletedImages(prev => [newImageData, ...prev]);
          setTasks(prev => prev.filter(t => t.id !== taskToProcess.id));
        } catch (hordeErr) {
          setTasks(prev => prev.filter(t => t.id !== taskToProcess.id));
          Alert.alert("All Servers Busy", "Pollinations and AI Horde are both overloaded.");
        }
      }
    }
  }, [activeStyle]);

  useEffect(() => {
    const processingCount = tasks.filter(t => t.status === 'generating').length;
    if (processingCount < parallelTasks) {
      const nextTask = tasks.find(t => t.status === 'waiting');
      if (nextTask) startProcessing(nextTask);
    }
  }, [tasks, parallelTasks, startProcessing]);

  const handleSaveToGallery = async (uri) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return Alert.alert("Permission", "Gallery access is required.");
      
      const fileUri = `${FileSystem.cacheDirectory}AI_${Date.now()}.jpg`;
      if (uri.startsWith('http')) {
        await FileSystem.downloadAsync(uri, fileUri);
      } else {
        await FileSystem.writeAsStringAsync(fileUri, uri, { encoding: FileSystem.EncodingType.Base64 });
      }
      
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync("AI Studio", asset, false);
      Alert.alert("Success ✨", "Image saved to gallery!");
    } catch (err) {
      Alert.alert("Error", "Could not save the image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      prompt: prompt.trim(),
      style: STYLES.find(s => s.id === activeStyle)?.name || 'Digital Art',
      status: 'waiting',
    }]);
    setPrompt('');
  };

  const ImageWithLoader = ({ uri, style }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const imageSource = uri.startsWith('http') ? { uri } : { uri: `data:image/webp;base64,${uri}` };

    return (
      <View style={[style, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
        <RNImage 
          source={imageSource} 
          style={[style, { position: 'absolute' }]} 
          onLoadEnd={() => setLoading(false)} 
          onError={() => { setLoading(false); setError(true); }}
        />
        {loading && <ActivityIndicator color={theme.primary} />}
        {error && <Text style={{color: '#666', fontSize: 10}}>Load Failed</Text>}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <Header />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
          <View style={styles.promptHeader}>
            <Wand2 size={16} color={theme.primary} />
            <Text style={[styles.promptLabel, { color: theme.textSecondary }]}>DESCRIBE YOUR VISION</Text>
          </View>
          <TextInput 
            placeholder="Generate your thoughts..."
            placeholderTextColor={theme.textSecondary}
            multiline 
            value={prompt} 
            onChangeText={setPrompt}
            style={[styles.textInput, { color: theme.textHeader }]}
          />
          <View style={styles.inputFooter}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.border }]}>
              <ImageIcon size={20} color={theme.textHeader} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.generateBtn, { backgroundColor: theme.primary }, !prompt.trim() && { opacity: 0.6 }]} 
              onPress={handleGenerate} 
              disabled={!prompt.trim()}
            >
              <Zap size={18} color="#FFF" fill="#FFF" />
              <Text style={styles.generateText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textHeader }]}>Artistic Styles</Text>
        <FlatList 
          horizontal data={STYLES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, marginBottom: 25 }}
          renderItem={({ item }) => {
            const isSelected = activeStyle === item.id;
            return (
              <TouchableOpacity onPress={() => setActiveStyle(item.id)} style={styles.styleItem}>
                <View style={[styles.imgWrapper, isSelected && { borderColor: theme.primary }]}>
                  <RNImage source={{ uri: item.img }} style={styles.styleImg} />
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                      <Zap size={10} color="#FFF" fill="#FFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.styleLabel, { color: isSelected ? theme.primary : theme.textSecondary }]}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <View style={{ marginBottom: 25 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textHeader, marginBottom: 0 }]}>Recent Works</Text>
            {isLoadingHistory && <ActivityIndicator size="small" style={{marginLeft: 10}} />}
          </View>
          <FlatList 
            horizontal 
            data={completedImages}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, paddingTop: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.resultCard, { backgroundColor: theme.border }]} 
                onPress={() => { setSelectedImage(item); setIsPreviewVisible(true); }}
              >
                <ImageWithLoader uri={item.uri} style={styles.resultImg} />
                <View style={styles.resultOverlay}>
                  <TouchableOpacity onPress={() => handleDeleteImage(item.id)} style={[styles.miniActionBtn, {backgroundColor: 'rgba(255,0,0,0.6)', marginBottom: 5}]}>
                    <Trash2 size={14} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleSaveToGallery(item.uri)} style={styles.miniActionBtn}>
                    <Download size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textHeader }]}>Rendering Queue</Text>
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <View key={task.id} style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <View style={styles.queueHeader}>
                  <View style={styles.row}>
                    {task.status === 'generating' ? <ActivityIndicator size="small" color={theme.primary} /> : <Clock size={16} color={theme.textSecondary} />}
                    <Text style={[styles.progressText, { color: task.status === 'generating' ? theme.primary : theme.textSecondary, marginLeft: 8 }]}>
                      {task.status === 'generating' ? 'AI IS PAINTING...' : 'QUEUED'}
                    </Text>
                  </View>
                  <Text style={{fontSize: 10, color: theme.textSecondary, fontWeight: 'bold'}}>#{index + 1}</Text>
               </View>
               <Text numberOfLines={1} style={[styles.promptPreview, { color: theme.textHeader }]}>
                 <Text style={{ color: theme.primary }}>[{task.style}]</Text> {task.prompt}
               </Text>
               <View style={[styles.barBg, { backgroundColor: theme.border }]}>
                 <View style={[styles.barFill, { backgroundColor: theme.primary, width: task.status === 'generating' ? '70%' : '10%' }]} />
               </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyQueue, { borderColor: theme.border }]}>
            <Sparkles size={24} color={theme.textSecondary} style={{ marginBottom: 8, opacity: 0.5 }} />
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>READY FOR NEW PROMPTS</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={isPreviewVisible} transparent animationType="fade" onRequestClose={() => setIsPreviewVisible(false)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeIcon} onPress={() => setIsPreviewVisible(false)}>
            <X color="#FFF" size={30} />
          </TouchableOpacity>
          {selectedImage && (
            <View style={styles.modalBody}>
              <RNImage 
                source={selectedImage.uri.startsWith('http') ? { uri: selectedImage.uri } : { uri: `data:image/webp;base64,${selectedImage.uri}` }} 
                style={styles.fullImg} 
                resizeMode="contain" 
              />
              <View style={styles.modalInfo}>
                <Text style={styles.modalPromptText}>"{selectedImage.prompt}"</Text>
                
                <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity 
                    style={[styles.modalDownload, { backgroundColor: '#ff4444', flex: 1 }]}
                    onPress={() => handleDeleteImage(selectedImage.id)}
                  >
                    <Trash2 size={20} color="#FFF" />
                    <Text style={styles.modalDownloadText}>Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.modalDownload, { backgroundColor: theme.primary, flex: 2 }]}
                    onPress={() => handleSaveToGallery(selectedImage.uri)}
                    disabled={isSaving}
                  >
                    {isSaving ? <ActivityIndicator color="#FFF" /> : <Download size={20} color="#FFF" />}
                    <Text style={styles.modalDownloadText}>{isSaving ? 'Saving...' : 'Save to Gallery'}</Text>
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
  container: { flex: 1 },
  inputCard: { margin: 20, borderRadius: 24, padding: 20, elevation: 4 },
  promptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  promptLabel: { fontSize: 10, fontWeight: '900', marginLeft: 8, letterSpacing: 1.2 },
  textInput: { minHeight: 80, textAlignVertical: 'top', fontSize: 16 },
  inputFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  iconBtn: { padding: 10, borderRadius: 12 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15 },
  generateText: { color: '#FFF', fontWeight: '800', marginLeft: 8, fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginLeft: 20, marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginLeft: 20 },
  styleItem: { marginRight: 15, alignItems: 'center' },
  imgWrapper: { borderRadius: 20, padding: 2, borderWidth: 2, borderColor: 'transparent' },
  styleImg: { width: 85, height: 100, borderRadius: 18 },
  checkBadge: { position: 'absolute', top: -4, right: -4, padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#FFF' },
  styleLabel: { fontSize: 11, marginTop: 6, fontWeight: '500' },
  progressCard: { marginHorizontal: 20, padding: 16, borderRadius: 20, marginBottom: 10, borderWidth: 1 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  progressText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  promptPreview: { fontSize: 13, marginBottom: 12, fontWeight: '500' },
  barBg: { width: '100%', height: 4, borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  emptyQueue: { marginHorizontal: 20, height: 80, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  resultCard: { width: 140, height: 180, marginRight: 15, borderRadius: 18, overflow: 'hidden' },
  resultImg: { width: 140, height: 180, borderRadius: 18 },
  resultOverlay: { position: 'absolute', bottom: 8, right: 8 },
  miniActionBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
  modalBody: { width: '100%', alignItems: 'center' },
  fullImg: { width: '90%', height: '65%', borderRadius: 24, backgroundColor: '#111' },
  modalInfo: { width: '90%', marginTop: 25, alignItems: 'center' },
  modalPromptText: { color: '#EEE', fontSize: 15, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  modalDownload: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, borderRadius: 18, justifyContent: 'center' },
  modalDownloadText: { color: '#FFF', fontWeight: '700', marginLeft: 10, fontSize: 14 }
});
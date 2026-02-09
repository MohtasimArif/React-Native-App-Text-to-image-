import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const scaleAnim = useRef(new Animated.Value(0)).current; 
  const opacityAnim = useRef(new Animated.Value(0)).current; 
  const textOpacityAnim = useRef(new Animated.Value(0)).current; 

  useEffect(() => {
    // Animation sequence starts immediately
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4, 
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacityAnim, {
        toValue: 1,
        duration: 800, 
        delay: 300, 
        useNativeDriver: true,
      }),
    ]).start();

    // Timer set to 10 seconds (10000 milliseconds)
    const timer = setTimeout(() => {
      onFinish();
    }, 6000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ 
        transform: [{ scale: scaleAnim }], 
        opacity: opacityAnim,
        alignItems: 'center' 
      }}>
        <Image 
          source={require('../../assets/appstore.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacityAnim, alignItems: 'center', marginTop: 30 }}>
        <Text style={styles.mainTitle}>AI IMAGE STUDIO</Text>
        <Text style={styles.developerText}>Developed by Mohtasim Arif</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.45, 
    height: width * 0.45,
  },
  mainTitle: {
    fontSize: 32, // Thoda bada font for better impact
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 3,
    marginBottom: 8,
    textAlign: 'center',
  },
  developerText: {
    fontSize: 14,
    color: '#A0A0A0', // Subtle grey
    fontWeight: '500',
    letterSpacing: 1,
  },
});
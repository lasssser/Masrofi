import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation sequence
    Animated.sequence([
      // First: Fade in "Masrofi by" text
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Wait a bit
      Animated.delay(200),
      // Then: Fade in and scale up logo
      Animated.parallel([
        Animated.timing(logoFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Hold for viewing
      Animated.delay(1500),
      // Fade out everything
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(logoFade, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Main content */}
      <View style={styles.content}>
        {/* App Name */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <Text style={styles.appName}>Masrofi</Text>
          <Text style={styles.byText}>by</Text>
        </Animated.View>

        {/* Company Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoFade,
              transform: [
                { scale: logoScale },
              ],
            },
          ]}
        >
          <Image
            source={require('../assets/images/company-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom tagline */}
      <Animated.View
        style={[
          styles.taglineContainer,
          { opacity: fadeAnim },
        ]}
      >
        <Text style={styles.tagline}>تطبيق إدارة المصاريف الشخصية</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 48,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  byText: {
    fontSize: 20,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  logo: {
    width: 180,
    height: 180,
  },
  taglineContainer: {
    position: 'absolute',
    bottom: 80,
  },
  tagline: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
});

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import AIChatModal from './AIChatModal';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function FloatingAIButton() {
  const pathname = usePathname();
  const [showChat, setShowChat] = useState(false);
  const scale = useSharedValue(1);

  // Hide on certain screens
  const hiddenPaths = ['expense/add', 'income/add', 'debt/add', 'shopping/add'];
  const shouldHide = hiddenPaths.some(path => pathname?.includes(path));

  // Pulse animation
  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (shouldHide) return null;

  return (
    <>
      <View style={styles.container}>
        <AnimatedTouchable
          style={[styles.button, animatedStyle]}
          onPress={() => setShowChat(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Ionicons name="sparkles" size={26} color="#FFFFFF" />
          </LinearGradient>
        </AnimatedTouchable>
      </View>
      
      <AIChatModal 
        visible={showChat} 
        onClose={() => setShowChat(false)} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 85 : 105,
    left: 20,
    zIndex: 9999,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

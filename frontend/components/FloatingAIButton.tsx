import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function FloatingAIButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide on analytics screen since it already has the chatbot
  const hiddenPaths = ['analytics', 'ai-chat', 'expense/add', 'income/add', 'debt/add'];
  const shouldHide = hiddenPaths.some(path => pathname?.includes(path));

  if (shouldHide) return null;

  const handlePress = () => {
    router.push('/analytics');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
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
      </TouchableOpacity>
    </View>
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

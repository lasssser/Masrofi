import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface BiometricLockProps {
  onSuccess: () => void;
}

export default function BiometricLock({ onSuccess }: BiometricLockProps) {
  const [error, setError] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'unknown'>('unknown');

  useEffect(() => {
    checkBiometricType();
    authenticate();
  }, []);

  const checkBiometricType = async () => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      }
    } catch (err) {
      console.error('Error checking biometric type:', err);
    }
  };

  const authenticate = async () => {
    setError(null);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'افتح مصروفي',
        cancelLabel: 'إلغاء',
        disableDeviceFallback: false,
        fallbackLabel: 'استخدم رمز المرور',
      });

      if (result.success) {
        onSuccess();
      } else {
        if (result.error === 'user_cancel') {
          setError('تم إلغاء المصادقة');
        } else {
          setError('فشل التحقق من الهوية');
        }
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحقق');
    }
  };

  const getIcon = () => {
    if (biometricType === 'face') {
      return 'scan-outline';
    }
    return 'finger-print-outline';
  };

  const getMessage = () => {
    if (biometricType === 'face') {
      return 'استخدم Face ID للدخول';
    }
    return 'استخدم بصمتك للدخول';
  };

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.backgroundLight]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.logoGradient}
          >
            <Ionicons name="wallet" size={48} color={COLORS.white} />
          </LinearGradient>
        </View>

        <Text style={styles.appName}>مصروفي</Text>
        <Text style={styles.appSubName}>by Wethaq</Text>

        {/* Biometric Icon */}
        <View style={styles.biometricContainer}>
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={authenticate}
            activeOpacity={0.8}
          >
            <Ionicons name={getIcon()} size={64} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.biometricText}>{getMessage()}</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Retry Button */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={authenticate}
        >
          <Text style={styles.retryText}>اضغط للمحاولة مرة أخرى</Text>
          <Ionicons name="refresh" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} />
        <Text style={styles.footerText}>بياناتك محمية ومشفرة</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: FONT_SIZES.xxxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  appSubName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
  },
  biometricContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  biometricButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  biometricText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.danger + '15',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.danger,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  retryText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
});

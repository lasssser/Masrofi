import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import { shoppingListStorage } from '../../utils/storage';
import { generateId } from '../../utils/helpers';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function AddShoppingListScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم القائمة');
      return;
    }

    setLoading(true);
    try {
      await shoppingListStorage.add({
        id: generateId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
      });
      router.back();
    } catch (error) {
      Alert.alert('خطأ', 'فشل إنشاء القائمة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Input
            label="اسم القائمة"
            placeholder="مثل: بيت، عمل، سفر..."
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Button
            title="إنشاء القائمة"
            onPress={handleSave}
            loading={loading}
            size="large"
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  saveButton: {
    marginTop: SPACING.lg,
  },
});

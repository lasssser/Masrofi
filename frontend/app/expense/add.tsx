import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { expenseStorage, CATEGORIES, settingsStorage, Settings } from '../../utils/storage';
import { generateId, formatDate } from '../../utils/helpers';
import { checkAchievements, streakStorage } from '../../utils/achievements';
import { checkSpendingAlerts } from '../../utils/alerts';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function AddExpenseScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settingsData = await settingsStorage.get();
    setSettings(settingsData);
  };

  const handleSave = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان المصروف');
      return;
    }

    setLoading(true);
    try {
      await expenseStorage.add({
        id: generateId(),
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: date.toISOString(),
        notes: notes.trim() || undefined,
      });
      
      // Check achievements and alerts after adding expense
      await Promise.all([
        streakStorage.update(),
        checkAchievements(),
        checkSpendingAlerts(),
      ]);
      
      router.back();
    } catch (error) {
      Alert.alert('خطأ', 'فشل حفظ المصروف');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Amount */}
          <Input
            label="المبلغ"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          {/* Title */}
          <Input
            label="العنوان"
            placeholder="مثل: غداء ، بنزين ، فاتورة..."
            value={title}
            onChangeText={setTitle}
          />

          {/* Category */}
          <View style={styles.categorySection}>
            <Text style={styles.label}>التصنيف</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    category === cat.id && styles.categoryItemActive,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor:
                          category === cat.id
                            ? COLORS.categoryColors[cat.id as keyof typeof COLORS.categoryColors]
                            : COLORS.surface,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={category === cat.id ? COLORS.white : COLORS.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === cat.id && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={styles.dateSection}>
            <Text style={styles.label}>التاريخ</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.dateText}>{formatDate(date.toISOString())}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Notes */}
          <Input
            label="ملاحظات (اختياري)"
            placeholder="أضف ملاحظات إضافية..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          {/* Save Button */}
          <Button
            title="حفظ المصروف"
            onPress={handleSave}
            loading={loading}
            size="large"
            style={styles.saveButton}
          />
        </ScrollView>
        </TouchableWithoutFeedback>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  categorySection: {
    marginBottom: SPACING.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundLight,
  },
  categoryItemActive: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dateSection: {
    marginBottom: SPACING.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  saveButton: {
    marginTop: SPACING.lg,
  },
});

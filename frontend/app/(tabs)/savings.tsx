import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import {
  savingsGoalStorage,
  SavingsGoal,
  settingsStorage,
  Settings,
  GOAL_COLORS,
} from '../../utils/storage';
import { formatCurrency, generateId, formatDate } from '../../utils/helpers';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

export default function SavingsScreen() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddAmountModal, setShowAddAmountModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalColor, setNewGoalColor] = useState(GOAL_COLORS[0]);
  const [addAmount, setAddAmount] = useState('');

  const loadData = async () => {
    try {
      const [goalsData, settingsData] = await Promise.all([
        savingsGoalStorage.getAll(),
        settingsStorage.get(),
      ]);
      setGoals(goalsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddGoal = async () => {
    if (!newGoalName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الهدف');
      return;
    }
    if (!newGoalTarget || parseFloat(newGoalTarget) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    await savingsGoalStorage.add({
      id: generateId(),
      name: newGoalName.trim(),
      targetAmount: parseFloat(newGoalTarget),
      currentAmount: 0,
      color: newGoalColor,
      createdAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalColor(GOAL_COLORS[0]);
    loadData();
  };

  const handleAddAmount = async () => {
    if (!selectedGoal || !addAmount || parseFloat(addAmount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    await savingsGoalStorage.addAmount(selectedGoal.id, parseFloat(addAmount));
    setShowAddAmountModal(false);
    setAddAmount('');
    setSelectedGoal(null);
    loadData();
  };

  const handleDeleteGoal = async (id: string) => {
    Alert.alert('حذف الهدف', 'هل أنت متأكد من حذف هذا الهدف؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await savingsGoalStorage.delete(id);
          loadData();
        },
      },
    ]);
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        {goals.length > 0 && (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="trending-up" size={32} color={COLORS.secondary} />
            </View>
            <Text style={styles.summaryTitle}>إجمالي المدخرات</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalSaved, settings.currency)}</Text>
            <Text style={styles.summaryTarget}>
              من أصل {formatCurrency(totalTarget, settings.currency)}
            </Text>
            <View style={styles.summaryProgress}>
              <View
                style={[
                  styles.summaryProgressFill,
                  { width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` },
                ]}
              />
            </View>
          </Card>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="لا توجد أهداف ادخار"
            subtitle="أضف هدفاً جديداً لتبدأ رحلة الادخار"
          />
        ) : (
          goals.map(goal => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            const isCompleted = percentage >= 100;

            return (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onPress={() => {
                  setSelectedGoal(goal);
                  setShowAddAmountModal(true);
                }}
                onLongPress={() => handleDeleteGoal(goal.id)}
              >
                <View style={styles.goalHeader}>
                  <View style={[styles.goalColorDot, { backgroundColor: goal.color }]} />
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalDate}>
                      تم إنشاؤه: {formatDate(goal.createdAt)}
                    </Text>
                  </View>
                  {isCompleted && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
                    </View>
                  )}
                </View>

                <View style={styles.goalAmounts}>
                  <Text style={styles.goalCurrent}>
                    {formatCurrency(goal.currentAmount, settings.currency)}
                  </Text>
                  <Text style={styles.goalTarget}>
                    / {formatCurrency(goal.targetAmount, settings.currency)}
                  </Text>
                </View>

                <View style={styles.goalProgress}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      { 
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isCompleted ? COLORS.secondary : goal.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={styles.goalPercentage}>{percentage.toFixed(0)}%</Text>
                  <Text style={styles.goalRemaining}>
                    {isCompleted 
                      ? '🎉 تم تحقيق الهدف!' 
                      : `متبقي: ${formatCurrency(goal.targetAmount - goal.currentAmount, settings.currency)}`
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>هدف ادخار جديد</Text>
              <View style={{ width: 24 }} />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="اسم الهدف (مثل: سيارة، سفر، طوارئ)"
              placeholderTextColor={COLORS.textMuted}
              value={newGoalName}
              onChangeText={setNewGoalName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="المبلغ المستهدف"
              placeholderTextColor={COLORS.textMuted}
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
              keyboardType="decimal-pad"
            />

            <Text style={styles.colorLabel}>اختر لوناً</Text>
            <View style={styles.colorPicker}>
              {GOAL_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newGoalColor === color && styles.colorOptionActive,
                  ]}
                  onPress={() => setNewGoalColor(color)}
                >
                  {newGoalColor === color && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Button title="إنشاء الهدف" onPress={handleAddGoal} size="large" style={styles.modalButton} />
          </View>
        </View>
      </Modal>

      {/* Add Amount Modal */}
      <Modal visible={showAddAmountModal} animationType="slide" transparent onRequestClose={() => setShowAddAmountModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddAmountModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة مبلغ</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedGoal && (
              <View style={styles.selectedGoalInfo}>
                <View style={[styles.goalColorDot, { backgroundColor: selectedGoal.color }]} />
                <Text style={styles.selectedGoalName}>{selectedGoal.name}</Text>
              </View>
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="المبلغ"
              placeholderTextColor={COLORS.textMuted}
              value={addAmount}
              onChangeText={setAddAmount}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Button title="إضافة" onPress={handleAddAmount} size="large" style={styles.modalButton} />
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  summaryCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  summaryAmount: {
    fontSize: FONT_SIZES.xxxl,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginVertical: SPACING.xs,
  },
  summaryTarget: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  summaryProgress: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  goalCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  goalColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: SPACING.sm,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  goalDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  completedBadge: {
    marginRight: SPACING.sm,
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  goalCurrent: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  goalTarget: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginRight: SPACING.xs,
  },
  goalProgress: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalPercentage: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  goalRemaining: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'right',
    marginBottom: SPACING.md,
  },
  colorLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  selectedGoalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  selectedGoalName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  modalButton: {
    marginTop: SPACING.sm,
  },
  fab: {
    position: 'absolute',
    left: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

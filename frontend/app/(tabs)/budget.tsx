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
  budgetStorage,
  expenseStorage,
  Budget,
  Expense,
  settingsStorage,
  Settings,
  CATEGORIES,
} from '../../utils/storage';
import { formatCurrency, generateId } from '../../utils/helpers';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('all');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadData = async () => {
    try {
      const [budgetsData, expensesData, settingsData] = await Promise.all([
        budgetStorage.getByMonth(currentMonth),
        expenseStorage.getAll(),
        settingsStorage.get(),
      ]);
      setBudgets(budgetsData);
      setExpenses(expensesData);
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

  const getMonthExpenses = () => {
    return expenses.filter(e => e.date.startsWith(currentMonth));
  };

  const getCategorySpent = (category: string) => {
    const monthExpenses = getMonthExpenses();
    if (category === 'all') {
      return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    }
    return monthExpenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);
  };

  const handleAddBudget = async () => {
    if (!newBudgetAmount || parseFloat(newBudgetAmount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    const existingBudget = budgets.find(b => b.category === newBudgetCategory);
    if (existingBudget) {
      await budgetStorage.update(existingBudget.id, { amount: parseFloat(newBudgetAmount) });
    } else {
      await budgetStorage.add({
        id: generateId(),
        category: newBudgetCategory,
        amount: parseFloat(newBudgetAmount),
        month: currentMonth,
        spent: getCategorySpent(newBudgetCategory),
      });
    }

    setShowAddModal(false);
    setNewBudgetAmount('');
    setNewBudgetCategory('all');
    loadData();
  };

  const handleDeleteBudget = async (id: string) => {
    Alert.alert('حذف الميزانية', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await budgetStorage.delete(id);
          loadData();
        },
      },
    ]);
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return COLORS.danger;
    if (percentage >= 80) return COLORS.warning;
    return COLORS.secondary;
  };

  const totalBudget = budgets.find(b => b.category === 'all');
  const totalSpent = getCategorySpent('all');

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
        {/* Total Budget Card */}
        {totalBudget ? (
          <Card style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <Text style={styles.totalTitle}>الميزانية الإجمالية</Text>
              <TouchableOpacity onPress={() => handleDeleteBudget(totalBudget.id)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
            <Text style={styles.totalAmount}>
              {formatCurrency(totalSpent, settings.currency)} / {formatCurrency(totalBudget.amount, settings.currency)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((totalSpent / totalBudget.amount) * 100, 100)}%`,
                    backgroundColor: getProgressColor(totalSpent, totalBudget.amount),
                  },
                ]}
              />
            </View>
            <Text style={styles.remainingText}>
              {totalSpent <= totalBudget.amount
                ? `متبقي: ${formatCurrency(totalBudget.amount - totalSpent, settings.currency)}`
                : `تجاوزت الميزانية بـ ${formatCurrency(totalSpent - totalBudget.amount, settings.currency)}`}
            </Text>
          </Card>
        ) : (
          <Card style={styles.addTotalCard}>
            <Ionicons name="wallet-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.addTotalText}>لم تحدد ميزانية شهرية بعد</Text>
            <Button
              title="تحديد الميزانية"
              onPress={() => {
                setNewBudgetCategory('all');
                setShowAddModal(true);
              }}
              size="small"
            />
          </Card>
        )}

        {/* Category Budgets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ميزانية الفئات</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setNewBudgetCategory('food');
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
              <Text style={styles.addButtonText}>إضافة</Text>
            </TouchableOpacity>
          </View>

          {budgets.filter(b => b.category !== 'all').length === 0 ? (
            <EmptyState
              icon="pie-chart-outline"
              title="لا توجد ميزانيات للفئات"
              subtitle="أضف ميزانية لكل فئة لتتبع إنفاقك"
            />
          ) : (
            budgets
              .filter(b => b.category !== 'all')
              .map(budget => {
                const spent = getCategorySpent(budget.category);
                const category = CATEGORIES.find(c => c.id === budget.category);
                const percentage = Math.min((spent / budget.amount) * 100, 100);

                return (
                  <TouchableOpacity
                    key={budget.id}
                    style={styles.categoryCard}
                    onLongPress={() => handleDeleteBudget(budget.id)}
                  >
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryInfo}>
                        <View style={[styles.categoryIcon, { backgroundColor: COLORS.categoryColors[budget.category as keyof typeof COLORS.categoryColors] || COLORS.textMuted }]}>
                          <Ionicons name={category?.icon as any || 'ellipsis-horizontal'} size={18} color={COLORS.white} />
                        </View>
                        <Text style={styles.categoryName}>{category?.label || budget.category}</Text>
                      </View>
                      <Text style={styles.categoryAmount}>
                        {formatCurrency(spent, settings.currency)} / {formatCurrency(budget.amount, settings.currency)}
                      </Text>
                    </View>
                    <View style={styles.categoryProgress}>
                      <View
                        style={[
                          styles.categoryProgressFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: getProgressColor(spent, budget.amount),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.categoryPercentage}>{percentage.toFixed(0)}%</Text>
                  </TouchableOpacity>
                );
              })
          )}
        </View>
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {newBudgetCategory === 'all' ? 'الميزانية الإجمالية' : 'ميزانية الفئة'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {newBudgetCategory !== 'all' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                {CATEGORIES.filter(c => c.id !== 'debts' && c.id !== 'savings').map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categorySelectorItem,
                      newBudgetCategory === cat.id && styles.categorySelectorItemActive,
                    ]}
                    onPress={() => setNewBudgetCategory(cat.id)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={newBudgetCategory === cat.id ? COLORS.white : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categorySelectorText,
                        newBudgetCategory === cat.id && styles.categorySelectorTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="المبلغ"
              placeholderTextColor={COLORS.textMuted}
              value={newBudgetAmount}
              onChangeText={setNewBudgetAmount}
              keyboardType="decimal-pad"
            />

            <Button title="حفظ" onPress={handleAddBudget} size="large" style={styles.modalButton} />
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setNewBudgetCategory('all');
          setShowAddModal(true);
        }}
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
  totalCard: {
    marginBottom: SPACING.lg,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  totalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  remainingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  addTotalCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  addTotalText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginVertical: SPACING.md,
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  categoryCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  categoryAmount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  categoryProgress: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'left',
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
  categorySelector: {
    marginBottom: SPACING.md,
  },
  categorySelectorItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  categorySelectorItemActive: {
    backgroundColor: COLORS.primary,
  },
  categorySelectorText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  categorySelectorTextActive: {
    color: COLORS.white,
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  TextInput,
  Keyboard,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, CATEGORIES } from '../../constants/theme';
import {
  expenseStorage,
  incomeStorage,
  settingsStorage,
  Settings,
  Expense,
  Income,
} from '../../utils/storage';
import { formatCurrency } from '../../utils/helpers';

type Transaction = (Expense | Income) & { type: 'expense' | 'income' };

export default function WalletScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadData = async () => {
    try {
      const [settingsData, expenses, incomes] = await Promise.all([
        settingsStorage.get(),
        expenseStorage.getByMonth(currentMonth),
        incomeStorage.getByMonth(currentMonth),
      ]);
      
      setSettings(settingsData);
      setTotalExpenses(expenses.reduce((sum, e) => sum + e.amount, 0));
      setTotalIncome(incomes.reduce((sum, i) => sum + i.amount, 0));
      
      // Combine and sort transactions
      const allTransactions: Transaction[] = [
        ...expenses.map(e => ({ ...e, type: 'expense' as const })),
        ...incomes.map(i => ({ ...i, type: 'income' as const })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions);
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

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'all' || t.type === filter;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>المحفظة</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/expense/add')}
          >
            <LinearGradient
              colors={COLORS.gradients.primary}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryCard}>
            <LinearGradient
              colors={[COLORS.secondary + '20', COLORS.secondary + '10']}
              style={styles.summaryCardContent}
            >
              <View style={[styles.summaryIcon, { backgroundColor: COLORS.secondary + '30' }]}>
                <Ionicons name="arrow-up" size={18} color={COLORS.secondary} />
              </View>
              <Text style={styles.summaryLabel}>الدخل</Text>
              <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>
                {formatCurrency(totalIncome, settings.currency)}
              </Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.summaryCard}>
            <LinearGradient
              colors={[COLORS.danger + '20', COLORS.danger + '10']}
              style={styles.summaryCardContent}
            >
              <View style={[styles.summaryIcon, { backgroundColor: COLORS.danger + '30' }]}>
                <Ionicons name="arrow-down" size={18} color={COLORS.danger} />
              </View>
              <Text style={styles.summaryLabel}>المصروفات</Text>
              <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                {formatCurrency(totalExpenses, settings.currency)}
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Search & Filter */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث في المعاملات..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                الكل
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'income' && styles.filterTabActive]}
              onPress={() => setFilter('income')}
            >
              <Text style={[styles.filterTabText, filter === 'income' && styles.filterTabTextActive]}>
                الدخل
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'expense' && styles.filterTabActive]}
              onPress={() => setFilter('expense')}
            >
              <Text style={[styles.filterTabText, filter === 'expense' && styles.filterTabTextActive]}>
                المصروفات
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Transactions List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, index) => {
              const category = getCategoryInfo((transaction as any).category || 'other');
              const isExpense = transaction.type === 'expense';
              
              return (
                <Animated.View 
                  key={transaction.id} 
                  entering={FadeInDown.delay(400 + index * 50)}
                >
                  <TouchableOpacity style={styles.transactionItem}>
                    <View style={[styles.transactionIcon, { backgroundColor: (isExpense ? category.color : COLORS.secondary) + '20' }]}>
                      <Ionicons 
                        name={isExpense ? (category.icon as any) : 'wallet'} 
                        size={22} 
                        color={isExpense ? category.color : COLORS.secondary} 
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{transaction.title}</Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.date).toLocaleDateString('ar-SA', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      { color: isExpense ? COLORS.danger : COLORS.secondary }
                    ]}>
                      {isExpense ? '-' : '+'}{formatCurrency(transaction.amount, settings.currency)}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="wallet-outline" size={48} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد معاملات</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'لا توجد نتائج للبحث' : 'ابدأ بإضافة دخل أو مصروف'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/expense/add')}
                >
                  <Text style={styles.emptyButtonText}>أضف معاملة</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  addButton: {
    width: 44,
    height: 44,
  },
  addButtonGradient: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
  },
  summaryCardContent: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginTop: SPACING.xs,
  },
  searchSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  transactionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  transactionDate: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
});

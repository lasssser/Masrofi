import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, CATEGORIES } from '../../constants/theme';
import {
  expenseStorage,
  incomeStorage,
  settingsStorage,
  Settings,
} from '../../utils/storage';
import { formatCurrency } from '../../utils/helpers';

const API_URL = 'http://45.9.191.190/masrofi-api';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function AnalyticsScreen() {
  const [settings, setSettings] = useState<Settings>({ currency: 'TRY', notificationsEnabled: true, biometricEnabled: false, theme: 'dark', language: 'ar' });
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{category: string; amount: number; color: string}[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');
  const scrollViewRef = useRef<ScrollView>(null);

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
      
      // Calculate category breakdown
      const breakdown: Record<string, number> = {};
      expenses.forEach(e => {
        breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
      });
      
      const sortedBreakdown = Object.entries(breakdown)
        .map(([category, amount]) => {
          const cat = CATEGORIES.find(c => c.id === category);
          return {
            category: cat?.label || category,
            amount,
            color: cat?.color || COLORS.textMuted,
          };
        })
        .sort((a, b) => b.amount - a.amount);
      
      setCategoryBreakdown(sortedBreakdown);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const [expenses, incomes] = await Promise.all([
        expenseStorage.getAll(),
        incomeStorage.getAll(),
      ]);

      const response = await fetch(`${API_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financial_data: {
            expenses,
            incomes,
            debts: [],
            budgets: [],
            savings_goals: [],
            recurring_expenses: [],
            currency: settings.currency,
          },
          analysis_type: 'full',
        }),
      });

      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: data.analysis || 'عذراً، حدث خطأ في التحليل.',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: 'عذراً، تعذر الاتصال بالخدمة. تأكد من اتصالك بالإنترنت.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const quickQuestions = [
    'كيف حالتي المالية؟',
    'أين أصرف أكثر؟',
    'كيف أوفر أكثر؟',
    'هل أنا مسرف؟',
  ];

  const balance = totalIncome - totalExpenses;
  const maxCategoryAmount = categoryBreakdown[0]?.amount || 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>التحليلات</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Ionicons 
              name="pie-chart" 
              size={20} 
              color={activeTab === 'overview' ? COLORS.white : COLORS.textMuted} 
            />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              نظرة عامة
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Ionicons 
              name="chatbubbles" 
              size={20} 
              color={activeTab === 'chat' ? COLORS.white : COLORS.textMuted} 
            />
            <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
              اسأل الذكاء
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Summary Card */}
            <Animated.View entering={FadeInDown.delay(100)}>
              <LinearGradient
                colors={COLORS.gradients.ocean}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <Text style={styles.summaryTitle}>ملخص الشهر</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>الدخل</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(totalIncome, settings.currency)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>المصروفات</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(totalExpenses, settings.currency)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>المتبقي</Text>
                    <Text style={[styles.summaryValue, { color: balance >= 0 ? '#34D399' : '#F87171' }]}>
                      {formatCurrency(balance, settings.currency)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Category Breakdown */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>توزيع المصاريف</Text>
              <View style={styles.categoryList}>
                {categoryBreakdown.length > 0 ? (
                  categoryBreakdown.map((cat, index) => (
                    <View key={cat.category} style={styles.categoryItem}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryAmount}>
                          {formatCurrency(cat.amount, settings.currency)}
                        </Text>
                        <Text style={styles.categoryName}>{cat.category}</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <Animated.View 
                          entering={FadeInDown.delay(300 + index * 50)}
                          style={[
                            styles.progressBar, 
                            { 
                              width: `${(cat.amount / maxCategoryAmount) * 100}%`,
                              backgroundColor: cat.color,
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>لا توجد بيانات بعد</Text>
                )}
              </View>
            </Animated.View>

            {/* Insights */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
              <Text style={styles.sectionTitle}>تحليلات سريعة</Text>
              <View style={styles.insightsList}>
                <View style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                    <Ionicons name="trending-up" size={20} color={COLORS.secondary} />
                  </View>
                  <View style={styles.insightInfo}>
                    <Text style={styles.insightTitle}>نسبة التوفير</Text>
                    <Text style={styles.insightValue}>
                      {totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0}%
                    </Text>
                  </View>
                </View>
                
                <View style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: COLORS.primary + '20' }]}>
                    <Ionicons name="receipt" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.insightInfo}>
                    <Text style={styles.insightTitle}>متوسط المصروف اليومي</Text>
                    <Text style={styles.insightValue}>
                      {formatCurrency(totalExpenses / 30, settings.currency)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: COLORS.accent + '20' }]}>
                    <Ionicons name="star" size={20} color={COLORS.accent} />
                  </View>
                  <View style={styles.insightInfo}>
                    <Text style={styles.insightTitle}>أكثر فئة إنفاقاً</Text>
                    <Text style={styles.insightValue}>
                      {categoryBreakdown[0]?.category || '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <View style={{ height: 120 }} />
          </ScrollView>
        ) : (
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
          >
            {/* Chat Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Welcome Message */}
              {chatMessages.length === 0 && (
                <Animated.View entering={FadeInUp.delay(100)} style={styles.welcomeContainer}>
                  <LinearGradient
                    colors={COLORS.gradients.primary}
                    style={styles.welcomeIcon}
                  >
                    <Ionicons name="sparkles" size={32} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={styles.welcomeTitle}>المستشار المالي الذكي</Text>
                  <Text style={styles.welcomeText}>
                    اسألني أي سؤال عن وضعك المالي وسأساعدك!
                  </Text>
                  
                  <View style={styles.quickQuestions}>
                    {quickQuestions.map((q, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.quickQuestion}
                        onPress={() => {
                          setInputText(q);
                        }}
                      >
                        <Text style={styles.quickQuestionText}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Messages */}
              {chatMessages.map((msg, index) => (
                <Animated.View
                  key={msg.id}
                  entering={FadeInUp.delay(index * 50)}
                  style={[
                    styles.messageBubble,
                    msg.type === 'user' ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  {msg.type === 'ai' && (
                    <View style={styles.aiIcon}>
                      <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                    </View>
                  )}
                  <Text style={[
                    styles.messageText,
                    msg.type === 'user' && styles.userMessageText
                  ]}>
                    {msg.text}
                  </Text>
                </Animated.View>
              ))}

              {isLoading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>جاري التحليل...</Text>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <LinearGradient
                  colors={inputText.trim() ? COLORS.gradients.primary : [COLORS.textMuted, COLORS.textMuted]}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={20} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="اكتب سؤالك هنا..."
                placeholderTextColor={COLORS.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
            </View>
          </KeyboardAvoidingView>
        )}
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
    padding: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  summaryCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  categoryList: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryItem: {
    marginBottom: SPACING.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  categoryAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  insightsList: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  insightTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  insightValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  chatContainer: {
    flex: 1,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  welcomeText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  quickQuestion: {
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickQuestionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  userBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.backgroundCard,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'right',
    flex: 1,
  },
  userMessageText: {
    color: COLORS.white,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'flex-end',
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 44,
    height: 44,
  },
  sendButtonGradient: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

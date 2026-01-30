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
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { expenseStorage, incomeStorage, settingsStorage } from '../utils/storage';

const { height } = Dimensions.get('window');
// Production API URL - Use environment variable or fallback to VPS
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://45.9.191.190/masrofi-api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  { id: '1', text: 'أين أصرف أكثر؟', icon: 'pie-chart' },
  { id: '2', text: 'كيف حالتي المالية؟', icon: 'pulse' },
  { id: '3', text: 'كيف أوفر أكثر؟', icon: 'trending-up' },
  { id: '4', text: 'نصيحة مالية', icon: 'bulb' },
];

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AIChatModal({ visible, onClose }: AIChatModalProps) {
  const { colors, isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      // Get financial data
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [expenses, incomes, settings] = await Promise.all([
        expenseStorage.getByMonth(currentMonth),
        incomeStorage.getByMonth(currentMonth),
        settingsStorage.get(),
      ]);

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

      // Group expenses by category
      const expensesByCategory: Record<string, number> = {};
      expenses.forEach(e => {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
      });

      const response = await fetch(`${API_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financial_data: {
            expenses: expenses.map(e => ({ amount: e.amount, category: e.category, title: e.title })),
            incomes: incomes.map(i => ({ amount: i.amount, title: i.title })),
            debts: [],
            budgets: [],
            savings_goals: [],
            recurring_expenses: [],
            currency: settings.currency,
          },
          analysis_type: 'full',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Build response from AI analysis
        let responseText = data.analysis || '';
        if (data.insights && data.insights.length > 0) {
          responseText += '\n\n💡 ملاحظات:\n' + data.insights.map((i: string) => `• ${i}`).join('\n');
        }
        if (data.recommendations && data.recommendations.length > 0) {
          responseText += '\n\n✅ توصيات:\n' + data.recommendations.map((r: string) => `• ${r}`).join('\n');
        }
        if (data.alerts && data.alerts.length > 0) {
          responseText += '\n\n⚠️ تنبيهات:\n' + data.alerts.map((a: string) => `• ${a}`).join('\n');
        }
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText || 'عذراً، لم أتمكن من الإجابة.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateLocalResponse(text),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const generateLocalResponse = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes('صرف') || q.includes('مصاريف')) {
      return '💡 لتحليل مصاريفك بشكل دقيق، تأكد من تسجيل جميع معاملاتك اليومية. سأتمكن من مساعدتك بشكل أفضل عندما يكون لديك بيانات كافية!';
    }
    if (q.includes('وفر') || q.includes('ادخار')) {
      return '💰 نصائح للتوفير:\n\n1. حدد ميزانية شهرية لكل فئة\n2. تجنب المشتريات العشوائية\n3. ابحث عن بدائل أرخص\n4. ادخر 20% من دخلك على الأقل';
    }
    if (q.includes('نصيحة') || q.includes('مالية')) {
      return '📊 نصيحة مالية:\n\nاتبع قاعدة 50/30/20:\n• 50% للاحتياجات الأساسية\n• 30% للرغبات\n• 20% للادخار والديون';
    }
    return '🤖 أنا مساعدك المالي الذكي! يمكنني مساعدتك في:\n\n• تحليل مصاريفك\n• نصائح للتوفير\n• تتبع ميزانيتك\n\nجرب سؤالي عن شيء محدد!';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: colors.backgroundLight }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.headerIcon}
              >
                <Ionicons name="sparkles" size={20} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.headerText, { color: colors.text }]}>المساعد المالي</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <Animated.View entering={FadeIn} style={styles.welcomeContainer}>
                <LinearGradient
                  colors={colors.gradients.primary}
                  style={styles.welcomeIcon}
                >
                  <Ionicons name="sparkles" size={40} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                  مرحباً! 👋
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                  أنا مساعدك المالي الذكي. اسألني أي سؤال!
                </Text>
                
                {/* Quick Questions */}
                <View style={styles.quickQuestions}>
                  {QUICK_QUESTIONS.map((q, index) => (
                    <Animated.View
                      key={q.id}
                      entering={FadeInUp.delay(200 + index * 100)}
                    >
                      <TouchableOpacity
                        style={[styles.quickQuestion, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => sendMessage(q.text)}
                      >
                        <Ionicons name={q.icon as any} size={18} color={colors.primary} />
                        <Text style={[styles.quickQuestionText, { color: colors.text }]}>{q.text}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            ) : (
              messages.map((message, index) => (
                <Animated.View
                  key={message.id}
                  entering={FadeInUp.delay(50)}
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userBubble : styles.aiBubble,
                    {
                      backgroundColor: message.role === 'user' ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  {message.role === 'assistant' && (
                    <View style={[styles.aiAvatar, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="sparkles" size={14} color={colors.primary} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      { color: message.role === 'user' ? '#FFF' : colors.text },
                    ]}
                  >
                    {message.content}
                  </Text>
                </Animated.View>
              ))
            )}
            
            {isLoading && (
              <View style={[styles.loadingBubble, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>يفكر...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.backgroundLight, borderTopColor: colors.border }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="اكتب سؤالك..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.surface }]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? '#FFF' : colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  quickQuestions: {
    width: '100%',
    gap: SPACING.sm,
  },
  quickQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  quickQuestionText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  userBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    textAlign: 'right',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignSelf: 'flex-end',
    maxWidth: '50%',
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  inputContainer: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    maxHeight: 100,
    paddingVertical: SPACING.sm,
    textAlign: 'right',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});

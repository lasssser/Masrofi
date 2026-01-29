import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expenseStorage, incomeStorage, budgetStorage, billReminderStorage } from './storage';

const ALERTS_KEY = 'masrofi_spending_alerts';
const LAST_ALERT_KEY = 'masrofi_last_alert';

export interface SpendingAlert {
  id: string;
  type: 'overspending' | 'budget_warning' | 'budget_exceeded' | 'bill_reminder' | 'savings_tip';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  createdAt: string;
  read: boolean;
  data?: any;
}

// Alert thresholds
const THRESHOLDS = {
  BUDGET_WARNING: 80, // Alert when 80% of budget is used
  BUDGET_DANGER: 100, // Alert when budget is exceeded
  DAILY_SPENDING_MULTIPLIER: 1.5, // Alert when daily spending is 1.5x average
  CATEGORY_SPIKE_MULTIPLIER: 2, // Alert when category spending is 2x usual
};

// Request notification permissions
export const requestAlertPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Store alerts
export const alertStorage = {
  async getAll(): Promise<SpendingAlert[]> {
    try {
      const data = await AsyncStorage.getItem(ALERTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  async add(alert: SpendingAlert): Promise<void> {
    const alerts = await this.getAll();
    alerts.unshift(alert);
    // Keep only last 50 alerts
    const trimmed = alerts.slice(0, 50);
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(trimmed));
  },

  async markAsRead(alertId: string): Promise<void> {
    const alerts = await this.getAll();
    const index = alerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      alerts[index].read = true;
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    }
  },

  async markAllAsRead(): Promise<void> {
    const alerts = await this.getAll();
    alerts.forEach(a => a.read = true);
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  },

  async getUnreadCount(): Promise<number> {
    const alerts = await this.getAll();
    return alerts.filter(a => !a.read).length;
  },

  async clear(): Promise<void> {
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify([]));
  },
};

// Generate unique ID
const generateAlertId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Check for overspending and create alerts
export const checkSpendingAlerts = async (): Promise<SpendingAlert[]> => {
  const newAlerts: SpendingAlert[] = [];
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  try {
    const [expenses, incomes, budgets] = await Promise.all([
      expenseStorage.getAll(),
      incomeStorage.getAll(),
      budgetStorage.getByMonth(currentMonth),
    ]);
    
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes
      .filter(i => i.date.startsWith(currentMonth))
      .reduce((sum, i) => sum + i.amount, 0);
    
    // Check budget alerts
    for (const budget of budgets) {
      const categoryExpenses = budget.category === 'all'
        ? totalExpenses
        : monthlyExpenses
            .filter(e => e.category === budget.category)
            .reduce((sum, e) => sum + e.amount, 0);
      
      const percentage = (categoryExpenses / budget.amount) * 100;
      
      if (percentage >= THRESHOLDS.BUDGET_DANGER && !await wasAlertSentRecently(`budget_exceeded_${budget.id}`)) {
        const alert: SpendingAlert = {
          id: generateAlertId(),
          type: 'budget_exceeded',
          title: '⚠️ تجاوزت الميزانية!',
          message: budget.category === 'all'
            ? `لقد تجاوزت ميزانيتك الشهرية بنسبة ${Math.round(percentage - 100)}%`
            : `لقد تجاوزت ميزانية ${getCategoryLabel(budget.category)} بنسبة ${Math.round(percentage - 100)}%`,
          severity: 'danger',
          createdAt: new Date().toISOString(),
          read: false,
          data: { budgetId: budget.id, percentage },
        };
        newAlerts.push(alert);
        await alertStorage.add(alert);
        await sendNotification(alert.title, alert.message);
        await markAlertSent(`budget_exceeded_${budget.id}`);
      } else if (percentage >= THRESHOLDS.BUDGET_WARNING && percentage < THRESHOLDS.BUDGET_DANGER && !await wasAlertSentRecently(`budget_warning_${budget.id}`)) {
        const alert: SpendingAlert = {
          id: generateAlertId(),
          type: 'budget_warning',
          title: '📊 تنبيه الميزانية',
          message: budget.category === 'all'
            ? `لقد استخدمت ${Math.round(percentage)}% من ميزانيتك الشهرية`
            : `لقد استخدمت ${Math.round(percentage)}% من ميزانية ${getCategoryLabel(budget.category)}`,
          severity: 'warning',
          createdAt: new Date().toISOString(),
          read: false,
          data: { budgetId: budget.id, percentage },
        };
        newAlerts.push(alert);
        await alertStorage.add(alert);
        await sendNotification(alert.title, alert.message);
        await markAlertSent(`budget_warning_${budget.id}`);
      }
    }
    
    // Check if spending exceeds income
    if (totalIncome > 0 && totalExpenses > totalIncome && !await wasAlertSentRecently('income_exceeded')) {
      const alert: SpendingAlert = {
        id: generateAlertId(),
        type: 'overspending',
        title: '🚨 إنفاق زائد!',
        message: `مصاريفك هذا الشهر تتجاوز دخلك بمبلغ ${Math.round(totalExpenses - totalIncome)}`,
        severity: 'danger',
        createdAt: new Date().toISOString(),
        read: false,
        data: { totalExpenses, totalIncome },
      };
      newAlerts.push(alert);
      await alertStorage.add(alert);
      await sendNotification(alert.title, alert.message);
      await markAlertSent('income_exceeded');
    }
    
    // Check daily spending spike
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = monthlyExpenses
      .filter(e => e.date.startsWith(today))
      .reduce((sum, e) => sum + e.amount, 0);
    
    const daysInMonth = new Date().getDate();
    const avgDailySpending = daysInMonth > 1 ? totalExpenses / daysInMonth : 0;
    
    if (avgDailySpending > 0 && todayExpenses > avgDailySpending * THRESHOLDS.DAILY_SPENDING_MULTIPLIER && !await wasAlertSentRecently('daily_spike')) {
      const alert: SpendingAlert = {
        id: generateAlertId(),
        type: 'overspending',
        title: '📈 إنفاق اليوم مرتفع',
        message: `أنفقت اليوم ${Math.round((todayExpenses / avgDailySpending - 1) * 100)}% أكثر من المعتاد`,
        severity: 'warning',
        createdAt: new Date().toISOString(),
        read: false,
        data: { todayExpenses, avgDailySpending },
      };
      newAlerts.push(alert);
      await alertStorage.add(alert);
      await markAlertSent('daily_spike');
    }
    
    // Generate savings tip if doing well
    if (totalIncome > 0 && totalExpenses < totalIncome * 0.7 && !await wasAlertSentRecently('savings_tip')) {
      const savingsRate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
      const alert: SpendingAlert = {
        id: generateAlertId(),
        type: 'savings_tip',
        title: '🎉 أحسنت!',
        message: `نسبة توفيرك هذا الشهر ${savingsRate}%! استمر على هذا النحو`,
        severity: 'info',
        createdAt: new Date().toISOString(),
        read: false,
        data: { savingsRate },
      };
      newAlerts.push(alert);
      await alertStorage.add(alert);
      await markAlertSent('savings_tip');
    }
    
  } catch (error) {
    console.error('Error checking spending alerts:', error);
  }
  
  return newAlerts;
};

// Check bill reminders
export const checkBillReminders = async (): Promise<SpendingAlert[]> => {
  const newAlerts: SpendingAlert[] = [];
  
  try {
    const bills = await billReminderStorage.getAll();
    const today = new Date();
    
    for (const bill of bills) {
      if (bill.isPaid) continue;
      
      const dueDate = new Date(bill.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Alert based on notifyDaysBefore setting
      if (daysUntilDue === bill.notifyDaysBefore && !await wasAlertSentRecently(`bill_${bill.id}_before`)) {
        const alert: SpendingAlert = {
          id: generateAlertId(),
          type: 'bill_reminder',
          title: '📅 تذكير بفاتورة',
          message: `فاتورة "${bill.title}" تستحق خلال ${daysUntilDue} أيام بقيمة ${bill.amount}`,
          severity: 'info',
          createdAt: new Date().toISOString(),
          read: false,
          data: { billId: bill.id },
        };
        newAlerts.push(alert);
        await alertStorage.add(alert);
        await sendNotification(alert.title, alert.message);
        await markAlertSent(`bill_${bill.id}_before`);
      }
      
      // Alert on due date
      if (daysUntilDue === 0 && !await wasAlertSentRecently(`bill_${bill.id}_due`)) {
        const alert: SpendingAlert = {
          id: generateAlertId(),
          type: 'bill_reminder',
          title: '⏰ فاتورة مستحقة اليوم!',
          message: `فاتورة "${bill.title}" مستحقة اليوم بقيمة ${bill.amount}`,
          severity: 'warning',
          createdAt: new Date().toISOString(),
          read: false,
          data: { billId: bill.id },
        };
        newAlerts.push(alert);
        await alertStorage.add(alert);
        await sendNotification(alert.title, alert.message);
        await markAlertSent(`bill_${bill.id}_due`);
      }
      
      // Alert if overdue
      if (daysUntilDue < 0 && !await wasAlertSentRecently(`bill_${bill.id}_overdue`)) {
        const alert: SpendingAlert = {
          id: generateAlertId(),
          type: 'bill_reminder',
          title: '🚨 فاتورة متأخرة!',
          message: `فاتورة "${bill.title}" متأخرة بـ ${Math.abs(daysUntilDue)} أيام`,
          severity: 'danger',
          createdAt: new Date().toISOString(),
          read: false,
          data: { billId: bill.id },
        };
        newAlerts.push(alert);
        await alertStorage.add(alert);
        await sendNotification(alert.title, alert.message);
        await markAlertSent(`bill_${bill.id}_overdue`);
      }
    }
  } catch (error) {
    console.error('Error checking bill reminders:', error);
  }
  
  return newAlerts;
};

// Send local notification
const sendNotification = async (title: string, body: string): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Track sent alerts to avoid duplicates
const wasAlertSentRecently = async (alertKey: string): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(LAST_ALERT_KEY);
    const sentAlerts: Record<string, string> = data ? JSON.parse(data) : {};
    
    if (sentAlerts[alertKey]) {
      const sentDate = new Date(sentAlerts[alertKey]);
      const now = new Date();
      // Don't resend same alert within 24 hours
      const hoursDiff = (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 24;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

const markAlertSent = async (alertKey: string): Promise<void> => {
  try {
    const data = await AsyncStorage.getItem(LAST_ALERT_KEY);
    const sentAlerts: Record<string, string> = data ? JSON.parse(data) : {};
    sentAlerts[alertKey] = new Date().toISOString();
    await AsyncStorage.setItem(LAST_ALERT_KEY, JSON.stringify(sentAlerts));
  } catch (error) {
    console.error('Error marking alert sent:', error);
  }
};

// Helper function to get category label
const getCategoryLabel = (categoryId: string): string => {
  const categories: Record<string, string> = {
    food: 'الطعام',
    transport: 'المواصلات',
    shopping: 'التسوق',
    bills: 'الفواتير',
    entertainment: 'الترفيه',
    health: 'الصحة',
    education: 'التعليم',
    other: 'أخرى',
  };
  return categories[categoryId] || categoryId;
};

// Get monthly comparison data
export const getMonthlyComparison = async (): Promise<{
  thisMonth: { total: number; byCategory: Record<string, number> };
  lastMonth: { total: number; byCategory: Record<string, number> };
  change: number;
  changePercent: number;
  categoryChanges: { category: string; change: number; changePercent: number }[];
}> => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  
  const expenses = await expenseStorage.getAll();
  
  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const lastMonthExpenses = expenses.filter(e => e.date.startsWith(lastMonth));
  
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Group by category
  const thisMonthByCategory: Record<string, number> = {};
  const lastMonthByCategory: Record<string, number> = {};
  
  thisMonthExpenses.forEach(e => {
    thisMonthByCategory[e.category] = (thisMonthByCategory[e.category] || 0) + e.amount;
  });
  
  lastMonthExpenses.forEach(e => {
    lastMonthByCategory[e.category] = (lastMonthByCategory[e.category] || 0) + e.amount;
  });
  
  // Calculate category changes
  const allCategories = new Set([
    ...Object.keys(thisMonthByCategory),
    ...Object.keys(lastMonthByCategory),
  ]);
  
  const categoryChanges = Array.from(allCategories).map(category => {
    const thisAmount = thisMonthByCategory[category] || 0;
    const lastAmount = lastMonthByCategory[category] || 0;
    const change = thisAmount - lastAmount;
    const changePercent = lastAmount > 0 ? (change / lastAmount) * 100 : thisAmount > 0 ? 100 : 0;
    
    return {
      category: getCategoryLabel(category),
      change,
      changePercent: Math.round(changePercent),
    };
  }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  
  return {
    thisMonth: { total: thisMonthTotal, byCategory: thisMonthByCategory },
    lastMonth: { total: lastMonthTotal, byCategory: lastMonthByCategory },
    change: thisMonthTotal - lastMonthTotal,
    changePercent: lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0,
    categoryChanges,
  };
};

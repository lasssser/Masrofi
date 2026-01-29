import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Debt } from './storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleDebtReminder(debt: Debt): Promise<string[]> {
  const notificationIds: string[] = [];
  const dueDate = new Date(debt.dueDate);
  const now = new Date();
  
  // Calculate 2 days before due date
  const twoDaysBefore = new Date(dueDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
  twoDaysBefore.setHours(9, 0, 0, 0);
  
  const debtTypeText = debt.type === 'لنا' ? 'مستحق لك' : 'عليك';
  
  // Schedule reminder 2 days before (if in the future)
  if (twoDaysBefore > now) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'تذكير بالدين',
          body: `${debtTypeText} دين من ${debt.personName} بقيمة ${debt.totalAmount} - يستحق بعد يومين`,
          data: { debtId: debt.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: twoDaysBefore,
        },
      });
      notificationIds.push(id);
    } catch (error) {
      console.error('Error scheduling 2-day reminder:', error);
    }
  }
  
  // Schedule reminder on due date
  const onDueDate = new Date(dueDate);
  onDueDate.setHours(9, 0, 0, 0);
  
  if (onDueDate > now) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'موعد استحقاق الدين',
          body: `${debtTypeText} دين من ${debt.personName} بقيمة ${debt.totalAmount} - مستحق اليوم`,
          data: { debtId: debt.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: onDueDate,
        },
      });
      notificationIds.push(id);
    } catch (error) {
      console.error('Error scheduling due date reminder:', error);
    }
  }
  
  return notificationIds;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

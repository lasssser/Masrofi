import AsyncStorage from '@react-native-async-storage/async-storage';
import { expenseStorage, incomeStorage, debtStorage, savingsGoalStorage } from './storage';

// Storage key for achievements
const ACHIEVEMENTS_KEY = 'masrofi_achievements';
const STREAK_KEY = 'masrofi_streak';
const POINTS_KEY = 'masrofi_points';

// Achievement definitions
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface UserStats {
  totalExpenses: number;
  totalIncome: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalPoints: number;
  level: number;
  achievementsUnlocked: number;
}

// All available achievements
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // Beginner achievements
  {
    id: 'first_expense',
    title: 'البداية',
    description: 'سجّل أول مصروف لك',
    icon: 'flag',
    color: '#6366F1',
    points: 10,
    target: 1,
  },
  {
    id: 'first_income',
    title: 'أول دخل',
    description: 'سجّل أول دخل لك',
    icon: 'wallet',
    color: '#10B981',
    points: 10,
    target: 1,
  },
  {
    id: 'expense_10',
    title: 'منظم',
    description: 'سجّل 10 مصاريف',
    icon: 'list',
    color: '#3B82F6',
    points: 25,
    target: 10,
  },
  {
    id: 'expense_50',
    title: 'محترف',
    description: 'سجّل 50 مصروف',
    icon: 'ribbon',
    color: '#8B5CF6',
    points: 50,
    target: 50,
  },
  {
    id: 'expense_100',
    title: 'خبير',
    description: 'سجّل 100 مصروف',
    icon: 'medal',
    color: '#F59E0B',
    points: 100,
    target: 100,
  },
  
  // Streak achievements
  {
    id: 'streak_3',
    title: '3 أيام متواصلة',
    description: 'سجّل مصاريفك 3 أيام متتالية',
    icon: 'flame',
    color: '#F97316',
    points: 15,
    target: 3,
  },
  {
    id: 'streak_7',
    title: 'أسبوع كامل',
    description: 'سجّل مصاريفك 7 أيام متتالية',
    icon: 'flame',
    color: '#EF4444',
    points: 30,
    target: 7,
  },
  {
    id: 'streak_30',
    title: 'شهر كامل',
    description: 'سجّل مصاريفك 30 يوم متتالي',
    icon: 'trophy',
    color: '#F59E0B',
    points: 100,
    target: 30,
  },
  
  // Savings achievements
  {
    id: 'saver_10',
    title: 'موفّر مبتدئ',
    description: 'وفّر 10% من دخلك في شهر',
    icon: 'trending-up',
    color: '#10B981',
    points: 25,
    target: 10,
  },
  {
    id: 'saver_20',
    title: 'موفّر ماهر',
    description: 'وفّر 20% من دخلك في شهر',
    icon: 'trending-up',
    color: '#059669',
    points: 50,
    target: 20,
  },
  {
    id: 'saver_30',
    title: 'موفّر محترف',
    description: 'وفّر 30% من دخلك في شهر',
    icon: 'star',
    color: '#F59E0B',
    points: 100,
    target: 30,
  },
  
  // Goal achievements
  {
    id: 'first_goal',
    title: 'طموح',
    description: 'أنشئ أول هدف ادخار',
    icon: 'flag',
    color: '#EC4899',
    points: 15,
    target: 1,
  },
  {
    id: 'goal_achieved',
    title: 'محقق الأهداف',
    description: 'حقق هدف ادخار واحد',
    icon: 'checkmark-circle',
    color: '#10B981',
    points: 75,
    target: 1,
  },
  
  // Debt achievements
  {
    id: 'debt_paid',
    title: 'حر من الديون',
    description: 'سدد دين واحد على الأقل',
    icon: 'checkmark-done',
    color: '#10B981',
    points: 50,
    target: 1,
  },
  
  // Budget achievements
  {
    id: 'budget_master',
    title: 'خبير الميزانية',
    description: 'التزم بميزانيتك لشهر كامل',
    icon: 'calculator',
    color: '#6366F1',
    points: 75,
    target: 1,
  },
  
  // AI achievements
  {
    id: 'ai_user',
    title: 'محلل ذكي',
    description: 'استخدم المساعد الذكي 5 مرات',
    icon: 'sparkles',
    color: '#8B5CF6',
    points: 25,
    target: 5,
  },
];

// Level thresholds
export const LEVELS = [
  { level: 1, name: 'مبتدئ', minPoints: 0, icon: '🌱' },
  { level: 2, name: 'متعلم', minPoints: 50, icon: '📚' },
  { level: 3, name: 'منظم', minPoints: 150, icon: '📋' },
  { level: 4, name: 'ماهر', minPoints: 300, icon: '⭐' },
  { level: 5, name: 'محترف', minPoints: 500, icon: '🏆' },
  { level: 6, name: 'خبير', minPoints: 750, icon: '💎' },
  { level: 7, name: 'أسطورة', minPoints: 1000, icon: '👑' },
];

// Achievement storage functions
export const achievementStorage = {
  async getAll(): Promise<Achievement[]> {
    try {
      const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Initialize with all achievements locked
      const initial = ACHIEVEMENT_DEFINITIONS.map(a => ({
        ...a,
        unlocked: false,
        progress: 0,
      }));
      await this.saveAll(initial);
      return initial;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  },

  async saveAll(achievements: Achievement[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  },

  async unlock(achievementId: string): Promise<Achievement | null> {
    const achievements = await this.getAll();
    const index = achievements.findIndex(a => a.id === achievementId);
    if (index !== -1 && !achievements[index].unlocked) {
      achievements[index].unlocked = true;
      achievements[index].unlockedAt = new Date().toISOString();
      await this.saveAll(achievements);
      
      // Add points
      await pointsStorage.addPoints(achievements[index].points);
      
      return achievements[index];
    }
    return null;
  },

  async updateProgress(achievementId: string, progress: number): Promise<Achievement | null> {
    const achievements = await this.getAll();
    const index = achievements.findIndex(a => a.id === achievementId);
    if (index !== -1) {
      achievements[index].progress = progress;
      
      // Check if achievement should be unlocked
      if (achievements[index].target && progress >= achievements[index].target && !achievements[index].unlocked) {
        achievements[index].unlocked = true;
        achievements[index].unlockedAt = new Date().toISOString();
        await this.saveAll(achievements);
        await pointsStorage.addPoints(achievements[index].points);
        return achievements[index];
      }
      
      await this.saveAll(achievements);
    }
    return null;
  },

  async getUnlocked(): Promise<Achievement[]> {
    const achievements = await this.getAll();
    return achievements.filter(a => a.unlocked);
  },

  async getProgress(): Promise<{ unlocked: number; total: number; percentage: number }> {
    const achievements = await this.getAll();
    const unlocked = achievements.filter(a => a.unlocked).length;
    return {
      unlocked,
      total: achievements.length,
      percentage: Math.round((unlocked / achievements.length) * 100),
    };
  },
};

// Streak storage
export const streakStorage = {
  async get(): Promise<{ current: number; longest: number; lastDate: string }> {
    try {
      const data = await AsyncStorage.getItem(STREAK_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return { current: 0, longest: 0, lastDate: '' };
    } catch (error) {
      return { current: 0, longest: 0, lastDate: '' };
    }
  },

  async update(): Promise<{ current: number; isNewDay: boolean; achievementUnlocked?: Achievement }> {
    const streak = await this.get();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let isNewDay = false;
    let achievementUnlocked: Achievement | undefined;
    
    if (streak.lastDate === today) {
      // Already logged today
      return { current: streak.current, isNewDay: false };
    }
    
    if (streak.lastDate === yesterday) {
      // Continue streak
      streak.current += 1;
      isNewDay = true;
    } else if (streak.lastDate !== today) {
      // Streak broken or first time
      streak.current = 1;
      isNewDay = true;
    }
    
    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }
    
    streak.lastDate = today;
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    
    // Check streak achievements
    if (streak.current === 3) {
      achievementUnlocked = await achievementStorage.unlock('streak_3') || undefined;
    } else if (streak.current === 7) {
      achievementUnlocked = await achievementStorage.unlock('streak_7') || undefined;
    } else if (streak.current === 30) {
      achievementUnlocked = await achievementStorage.unlock('streak_30') || undefined;
    }
    
    // Update achievement progress
    await achievementStorage.updateProgress('streak_3', streak.current);
    await achievementStorage.updateProgress('streak_7', streak.current);
    await achievementStorage.updateProgress('streak_30', streak.current);
    
    return { current: streak.current, isNewDay, achievementUnlocked };
  },
};

// Points storage
export const pointsStorage = {
  async get(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(POINTS_KEY);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      return 0;
    }
  },

  async addPoints(points: number): Promise<number> {
    const current = await this.get();
    const newTotal = current + points;
    await AsyncStorage.setItem(POINTS_KEY, newTotal.toString());
    return newTotal;
  },

  async getLevel(): Promise<{ level: number; name: string; icon: string; progress: number; nextLevel?: typeof LEVELS[0] }> {
    const points = await this.get();
    let currentLevel = LEVELS[0];
    let nextLevel: typeof LEVELS[0] | undefined;
    
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].minPoints) {
        currentLevel = LEVELS[i];
        nextLevel = LEVELS[i + 1];
        break;
      }
    }
    
    const progress = nextLevel 
      ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
      : 100;
    
    return {
      ...currentLevel,
      progress: Math.min(progress, 100),
      nextLevel,
    };
  },
};

// Check and update achievements based on user activity
export const checkAchievements = async (): Promise<Achievement[]> => {
  const newlyUnlocked: Achievement[] = [];
  
  try {
    // Check expense count
    const expenses = await expenseStorage.getAll();
    const expenseCount = expenses.length;
    
    if (expenseCount >= 1) {
      const a = await achievementStorage.unlock('first_expense');
      if (a) newlyUnlocked.push(a);
    }
    if (expenseCount >= 10) {
      const a = await achievementStorage.unlock('expense_10');
      if (a) newlyUnlocked.push(a);
    }
    if (expenseCount >= 50) {
      const a = await achievementStorage.unlock('expense_50');
      if (a) newlyUnlocked.push(a);
    }
    if (expenseCount >= 100) {
      const a = await achievementStorage.unlock('expense_100');
      if (a) newlyUnlocked.push(a);
    }
    
    // Update progress
    await achievementStorage.updateProgress('first_expense', expenseCount);
    await achievementStorage.updateProgress('expense_10', expenseCount);
    await achievementStorage.updateProgress('expense_50', expenseCount);
    await achievementStorage.updateProgress('expense_100', expenseCount);
    
    // Check income
    const incomes = await incomeStorage.getAll();
    if (incomes.length >= 1) {
      const a = await achievementStorage.unlock('first_income');
      if (a) newlyUnlocked.push(a);
    }
    
    // Check savings rate
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyIncome = incomes
      .filter(i => i.date.startsWith(currentMonth))
      .reduce((sum, i) => sum + i.amount, 0);
    const monthlyExpenses = expenses
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
    
    if (monthlyIncome > 0) {
      const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
      
      await achievementStorage.updateProgress('saver_10', savingsRate);
      await achievementStorage.updateProgress('saver_20', savingsRate);
      await achievementStorage.updateProgress('saver_30', savingsRate);
      
      if (savingsRate >= 10) {
        const a = await achievementStorage.unlock('saver_10');
        if (a) newlyUnlocked.push(a);
      }
      if (savingsRate >= 20) {
        const a = await achievementStorage.unlock('saver_20');
        if (a) newlyUnlocked.push(a);
      }
      if (savingsRate >= 30) {
        const a = await achievementStorage.unlock('saver_30');
        if (a) newlyUnlocked.push(a);
      }
    }
    
    // Check savings goals
    const goals = await savingsGoalStorage.getAll();
    if (goals.length >= 1) {
      const a = await achievementStorage.unlock('first_goal');
      if (a) newlyUnlocked.push(a);
    }
    
    const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);
    if (completedGoals.length >= 1) {
      const a = await achievementStorage.unlock('goal_achieved');
      if (a) newlyUnlocked.push(a);
    }
    
    // Check debts
    const debts = await debtStorage.getAll();
    const paidDebts = debts.filter(d => d.status === 'مدفوع');
    if (paidDebts.length >= 1) {
      const a = await achievementStorage.unlock('debt_paid');
      if (a) newlyUnlocked.push(a);
    }
    
    // Update streak
    await streakStorage.update();
    
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
  
  return newlyUnlocked;
};

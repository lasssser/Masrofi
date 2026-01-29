// Modern Design System for Masrofi
// Glassmorphism + Modern UI + Arabic RTL

export const COLORS = {
  // Primary Gradient
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  
  // Secondary (Gold/Success)
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: '#34D399',
  
  // Accent (Gold)
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FBBF24',
  
  // Danger
  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerLight: '#F87171',
  
  // Warning
  warning: '#F59E0B',
  
  // Backgrounds
  background: '#0F0F1A',
  backgroundLight: '#1A1A2E',
  backgroundCard: 'rgba(255, 255, 255, 0.05)',
  backgroundGlass: 'rgba(255, 255, 255, 0.08)',
  
  // Surface
  surface: '#16213E',
  surfaceLight: '#1F2937',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  
  // Border
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  
  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  
  // Category Colors
  categoryColors: {
    food: '#F97316',
    transport: '#3B82F6',
    shopping: '#EC4899',
    bills: '#EF4444',
    entertainment: '#8B5CF6',
    health: '#10B981',
    education: '#06B6D4',
    other: '#6B7280',
    savings: '#F59E0B',
    income: '#10B981',
  },
  
  // Gradients
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#EF4444', '#F87171'],
    dark: ['#1A1A2E', '#16213E'],
    gold: ['#F59E0B', '#D97706'],
    purple: ['#8B5CF6', '#6366F1'],
    ocean: ['#0EA5E9', '#6366F1'],
    sunset: ['#F97316', '#EC4899'],
  },
  
  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
  },
  
  white: '#FFFFFF',
  black: '#000000',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 40,
  hero: 48,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const FONTS = {
  regular: 'Cairo_400Regular',
  medium: 'Cairo_500Medium',
  semiBold: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
};

// Animation Durations
export const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Categories with icons
export const CATEGORIES = [
  { id: 'food', label: 'طعام', icon: 'fast-food', color: COLORS.categoryColors.food },
  { id: 'transport', label: 'مواصلات', icon: 'car', color: COLORS.categoryColors.transport },
  { id: 'shopping', label: 'تسوق', icon: 'bag', color: COLORS.categoryColors.shopping },
  { id: 'bills', label: 'فواتير', icon: 'receipt', color: COLORS.categoryColors.bills },
  { id: 'entertainment', label: 'ترفيه', icon: 'game-controller', color: COLORS.categoryColors.entertainment },
  { id: 'health', label: 'صحة', icon: 'medical', color: COLORS.categoryColors.health },
  { id: 'education', label: 'تعليم', icon: 'school', color: COLORS.categoryColors.education },
  { id: 'other', label: 'أخرى', icon: 'ellipsis-horizontal', color: COLORS.categoryColors.other },
];

export const CURRENCIES = [
  { code: 'TRY', symbol: '₺', label: 'ليرة تركية' },
  { code: 'USD', symbol: '$', label: 'دولار أمريكي' },
  { code: 'EUR', symbol: '€', label: 'يورو' },
  { code: 'SYP', symbol: 'ل.س', label: 'ليرة سورية' },
  { code: 'SAR', symbol: 'ر.س', label: 'ريال سعودي' },
  { code: 'AED', symbol: 'د.إ', label: 'درهم إماراتي' },
];

// Achievement Badges
export const BADGES = [
  { id: 'first_expense', title: 'البداية', description: 'أول مصروف مسجل', icon: 'flag', color: '#6366F1' },
  { id: 'week_streak', title: 'أسبوع متواصل', description: '7 أيام تسجيل متواصل', icon: 'flame', color: '#F97316' },
  { id: 'month_streak', title: 'شهر كامل', description: '30 يوم تسجيل متواصل', icon: 'trophy', color: '#F59E0B' },
  { id: 'saver', title: 'موفّر', description: 'وفرت 20% من دخلك', icon: 'wallet', color: '#10B981' },
  { id: 'budget_master', title: 'خبير الميزانية', description: 'التزمت بالميزانية شهر كامل', icon: 'ribbon', color: '#8B5CF6' },
  { id: 'debt_free', title: 'حر من الديون', description: 'سددت كل ديونك', icon: 'checkmark-circle', color: '#10B981' },
  { id: 'goal_achiever', title: 'محقق الأهداف', description: 'حققت هدف ادخار', icon: 'star', color: '#F59E0B' },
  { id: 'analyst', title: 'محلل مالي', description: 'استخدمت التحليل الذكي 10 مرات', icon: 'analytics', color: '#6366F1' },
];

// Challenges
export const CHALLENGES = [
  { id: 'no_junk', title: 'بدون كماليات', description: 'لا تصرف على الكماليات لمدة أسبوع', duration: 7, reward: 50 },
  { id: 'cook_home', title: 'طبخ منزلي', description: 'لا تطلب أكل من الخارج لمدة أسبوع', duration: 7, reward: 100 },
  { id: 'save_10', title: 'وفر 10%', description: 'وفر 10% من دخلك هذا الشهر', duration: 30, reward: 200 },
  { id: 'track_all', title: 'سجل كل شيء', description: 'سجل كل مصاريفك لمدة أسبوع', duration: 7, reward: 75 },
];

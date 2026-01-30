import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import {
  achievementStorage,
  pointsStorage,
  streakStorage,
  Achievement,
  LEVELS,
} from '../utils/achievements';

export default function AchievementsScreen() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(LEVELS[0]);
  const [levelProgress, setLevelProgress] = useState(0);
  const [nextLevel, setNextLevel] = useState<typeof LEVELS[0] | undefined>();
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    const [achievementsData, pointsData, levelData, streakData] = await Promise.all([
      achievementStorage.getAll(),
      pointsStorage.get(),
      pointsStorage.getLevel(),
      streakStorage.get(),
    ]);
    
    setAchievements(achievementsData);
    setPoints(pointsData);
    setLevel(levelData);
    setLevelProgress(levelData.progress);
    setNextLevel(levelData.nextLevel);
    setStreak(streakData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredAchievements = achievements.filter(a => {
    if (selectedTab === 'unlocked') return a.unlocked;
    if (selectedTab === 'locked') return !a.unlocked;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإنجازات</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{unlockedCount}/{achievements.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Level Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <LinearGradient
            colors={COLORS.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelCard}
          >
            <View style={styles.levelHeader}>
              <View style={styles.levelInfo}>
                <Text style={styles.levelEmoji}>{level.icon}</Text>
                <View>
                  <Text style={styles.levelLabel}>المستوى {level.level}</Text>
                  <Text style={styles.levelName}>{level.name}</Text>
                </View>
              </View>
              <View style={styles.pointsBadge}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.pointsText}>{points}</Text>
              </View>
            </View>

            {nextLevel && (
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(levelProgress)}% للمستوى التالي
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="flame" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{streak.current}</Text>
            <Text style={styles.statLabel}>يوم متواصل</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.secondary + '20' }]}>
              <Ionicons name="trophy" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.statValue}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>إنجاز</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="star" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{points}</Text>
            <Text style={styles.statLabel}>نقطة</Text>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, selectedTab === 'all' && styles.filterTabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[styles.filterTabText, selectedTab === 'all' && styles.filterTabTextActive]}>
              الكل
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, selectedTab === 'unlocked' && styles.filterTabActive]}
            onPress={() => setSelectedTab('unlocked')}
          >
            <Text style={[styles.filterTabText, selectedTab === 'unlocked' && styles.filterTabTextActive]}>
              مفتوحة
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, selectedTab === 'locked' && styles.filterTabActive]}
            onPress={() => setSelectedTab('locked')}
          >
            <Text style={[styles.filterTabText, selectedTab === 'locked' && styles.filterTabTextActive]}>
              مقفلة
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Achievements List */}
        <View style={styles.achievementsList}>
          {filteredAchievements.map((achievement, index) => (
            <Animated.View
              key={achievement.id}
              entering={FadeInUp.delay(400 + index * 50)}
            >
              <TouchableOpacity
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementCardLocked,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedAchievement(achievement);
                  setShowModal(true);
                }}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: achievement.unlocked
                        ? achievement.color + '20'
                        : COLORS.backgroundLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={achievement.icon as any}
                    size={28}
                    color={achievement.unlocked ? achievement.color : COLORS.textMuted}
                  />
                  {!achievement.unlocked && (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={12} color={COLORS.white} />
                    </View>
                  )}
                </View>
                
                <View style={styles.achievementInfo}>
                  <Text
                    style={[
                      styles.achievementTitle,
                      !achievement.unlocked && styles.achievementTitleLocked,
                    ]}
                  >
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  
                  {/* Progress bar for locked achievements */}
                  {!achievement.unlocked && achievement.target && (
                    <View style={styles.achievementProgress}>
                      <View style={styles.achievementProgressBar}>
                        <View
                          style={[
                            styles.achievementProgressFill,
                            {
                              width: `${Math.min(((achievement.progress || 0) / achievement.target) * 100, 100)}%`,
                              backgroundColor: achievement.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.achievementProgressText}>
                        {achievement.progress || 0}/{achievement.target}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.achievementPoints}>
                  <Ionicons
                    name="star"
                    size={14}
                    color={achievement.unlocked ? '#F59E0B' : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.achievementPointsText,
                      !achievement.unlocked && styles.achievementPointsTextLocked,
                    ]}
                  >
                    {achievement.points}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAchievement && (
              <>
                <View style={[styles.modalIcon, { backgroundColor: selectedAchievement.color + '20' }]}>
                  <Ionicons
                    name={selectedAchievement.icon as any}
                    size={48}
                    color={selectedAchievement.color}
                  />
                </View>
                <Text style={styles.modalTitle}>{selectedAchievement.title}</Text>
                <Text style={styles.modalDescription}>{selectedAchievement.description}</Text>
                
                <View style={styles.modalDivider} />
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>الحالة:</Text>
                  <Text style={[styles.modalValue, { color: selectedAchievement.unlocked ? COLORS.secondary : COLORS.warning }]}>
                    {selectedAchievement.unlocked ? '✅ مفتوح' : '🔒 مقفل'}
                  </Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>النقاط:</Text>
                  <Text style={styles.modalValue}>⭐ {selectedAchievement.points} نقطة</Text>
                </View>
                
                {!selectedAchievement.unlocked && selectedAchievement.target && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalLabel}>التقدم:</Text>
                    <Text style={styles.modalValue}>
                      {selectedAchievement.progress || 0} / {selectedAchievement.target}
                    </Text>
                  </View>
                )}
                
                <View style={styles.modalDivider} />
                
                <Text style={styles.modalHowTo}>
                  {selectedAchievement.unlocked 
                    ? '🎉 أحسنت! لقد حققت هذا الإنجاز'
                    : `💡 كيف تحقق هذا الإنجاز:\n${getAchievementHint(selectedAchievement.id)}`
                  }
                </Text>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: selectedAchievement.color }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalButtonText}>حسناً</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper function for achievement hints
function getAchievementHint(id: string): string {
  const hints: { [key: string]: string } = {
    'first_expense': 'أضف أول مصروف في التطبيق',
    'week_streak': 'سجل مصاريفك يومياً لمدة 7 أيام متتالية',
    'month_streak': 'سجل مصاريفك يومياً لمدة 30 يوم متتالي',
    'budget_master': 'أنشئ 5 ميزانيات مختلفة',
    'savings_starter': 'أنشئ هدف ادخار واحد على الأقل',
    'savings_champion': 'حقق هدف ادخار كامل',
    'expense_tracker': 'سجل 50 مصروف في التطبيق',
    'expense_master': 'سجل 200 مصروف في التطبيق',
    'category_explorer': 'استخدم 5 فئات مختلفة للمصاريف',
    'debt_free': 'سدد جميع ديونك',
    'first_income': 'أضف أول دخل في التطبيق',
    'income_diversifier': 'أضف 3 مصادر دخل مختلفة',
  };
  return hints[id] || 'استمر في استخدام التطبيق لتحقيق هذا الإنجاز';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  headerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  headerBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  levelCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  levelEmoji: {
    fontSize: 40,
  },
  levelLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  levelName: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  pointsText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  progressSection: {
    marginTop: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
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
  achievementsList: {
    gap: SPACING.sm,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  achievementCardLocked: {
    opacity: 0.7,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  achievementTitleLocked: {
    color: COLORS.textSecondary,
  },
  achievementDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'right',
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  achievementProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  achievementPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  achievementPointsText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: '#F59E0B',
  },
  achievementPointsTextLocked: {
    color: COLORS.textMuted,
  },
});

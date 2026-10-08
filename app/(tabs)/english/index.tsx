import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';

const ModuleCard = ({ 
  title, 
  description, 
  iconName, 
  iconColor, 
  iconBgColor, 
  isComingSoon, 
  onPress 
}: {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
  isComingSoon?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity 
    style={[styles.moduleCard, isComingSoon && styles.moduleCardDisabled]} 
    activeOpacity={isComingSoon ? 1 : 0.8}
    onPress={isComingSoon ? undefined : onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
  >
    <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
      <Ionicons name={iconName} size={32} color={iconColor} />
    </View>
    <Text style={styles.moduleTitle}>{title}</Text>
    <Text style={styles.moduleDesc}>{description}</Text>
    {isComingSoon && (
      <View style={styles.badgeSoon}>
        <Text style={styles.badgeText}>SEGERA</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default function EnglishDashboardScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>English Mastery</Text>
            <Text style={styles.subtitle}>Tingkatkan kemampuan bahasamu hari ini!</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Ionicons name="school" size={28} color={Colors.brand.yuzu} />
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.progressGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Weekly Goal</Text>
              <Text style={styles.progressCount}>12 / 50 Kata</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '24%' }]} />
            </View>
            <Text style={styles.progressMotivation}>Ayo pelajari 38 kata lagi minggu ini!</Text>
          </LinearGradient>
        </View>

        {/* Modules Grid */}
        <Text style={styles.sectionTitle}>Modul Pembelajaran</Text>
        
        <View style={styles.gridContainer}>
          <ModuleCard
            title="Kamus Pintar"
            description="Cari kata, V2, V3, & V-ing dengan cepat."
            iconName="book"
            iconColor={Colors.brand.yuzu}
            iconBgColor="rgba(250, 204, 21, 0.15)"
            onPress={() => router.push('/english/dictionary')}
          />
          <ModuleCard
            title="Flashcards"
            description="Hafalan kata interaktif."
            iconName="albums"
            iconColor="#38BDF8"
            iconBgColor="rgba(56, 189, 248, 0.15)"
            isComingSoon
          />
          <ModuleCard
            title="Grammar Quiz"
            description="Uji pemahaman tatabahasa."
            iconName="game-controller"
            iconColor={Colors.brand.ruby}
            iconBgColor="rgba(244, 63, 94, 0.15)"
            isComingSoon
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: Platform.OS === 'ios' ? 10 : 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 6,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.brand,
  },
  progressCard: {
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  progressGradient: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border.faint,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    color: Colors.text.title,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 20,
    color: '#38BDF8',
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.border.light,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  progressMotivation: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  moduleCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: Colors.border.light,
    position: 'relative',
    overflow: 'hidden',
  },
  moduleCardDisabled: {
    opacity: 0.6,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  moduleDesc: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  badgeSoon: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: Colors.background.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.text.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});

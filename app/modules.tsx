import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { TouchableScale } from '../components/ui/TouchableScale';

export default function ModulesScreen() {
  const insets = useSafeAreaInsets();

  const MODULES = [
    { id: 'finance', title: 'Finance', subtitle: 'Lacak pengeluaran & dompet', icon: 'wallet', color: Colors.brand.mint, route: '/finance' },
    { id: 'english', title: 'English Hub', subtitle: 'Kamus, Quiz, & Flashcard', icon: 'school', color: Colors.brand.yuzu, route: '/english' },
    { id: 'sports', title: 'Sports', subtitle: 'Catat lari & kalori', icon: 'football', color: Colors.brand.ruby, route: '/sports' },
    { id: 'vehicle', title: 'Vehicle', subtitle: 'Bensin & Odometer', icon: 'car', color: '#3B82F6', route: '/vehicle' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>All Modules</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {MODULES.map((mod) => (
            <TouchableScale 
              key={mod.id} 
              style={styles.card} 
              scaleTo={0.95}
              onPress={() => router.push(mod.route as any)}
            >
              <View style={[styles.iconBg, { backgroundColor: `${mod.color}25` }]}>
                <Ionicons name={mod.icon as any} size={36} color={mod.color} />
              </View>
              <Text style={styles.cardTitle}>{mod.title}</Text>
              <Text style={styles.cardSubtitle}>{mod.subtitle}</Text>
            </TouchableScale>
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    marginRight: 16,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

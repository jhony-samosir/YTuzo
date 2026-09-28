import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Subscription } from '../../types/finance';
import { formatMoney, safeAlpha } from '../../utils/finance';
import { EmptyState } from '../ui/EmptyState';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface ScheduledTabProps {
  subscriptions: Subscription[];
  onAdd: () => void;
  onEdit: (sub: Subscription) => void;
  onTogglePause?: (id: string, isPaused: boolean) => void;
}

export const ScheduledTab: React.FC<ScheduledTabProps> = ({ subscriptions, onAdd, onEdit, onTogglePause }) => {
  // eslint-disable-next-line react-hooks/purity
  const currentTimestamp = Date.now();

  // 1. Calculate Monthly Projection
  const { totalInflow, totalOutflow } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    subscriptions.forEach(s => {
      if (s.is_paused) return; // Skip paused ones for projection
      
      let monthlyMultiplier = 1;
      if (s.billing_cycle === 'DAILY') monthlyMultiplier = 30;
      else if (s.billing_cycle === 'WEEKLY') monthlyMultiplier = 4.33;
      else if (s.billing_cycle === 'YEARLY') monthlyMultiplier = 1 / 12;

      const monthlyAmount = s.amount * monthlyMultiplier;
      if (s.type === 'INCOME') inflow += monthlyAmount;
      else outflow += monthlyAmount;
    });
    return { totalInflow: inflow, totalOutflow: outflow };
  }, [subscriptions]);

  // 2. Group Subscriptions
  const { incomes, expenses } = useMemo(() => {
    const inc: Subscription[] = [];
    const exp: Subscription[] = [];
    subscriptions.forEach(s => {
      if (s.type === 'INCOME') inc.push(s);
      else exp.push(s);
    });
    return { incomes: inc, expenses: exp };
  }, [subscriptions]);

  const renderCard = (s: Subscription, index: number) => {
    const date = new Date(s.next_billing_date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Check if due soon (<= 3 days)
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = currentTimestamp ? ((s.next_billing_date - currentTimestamp) / msPerDay) : -1;
    const isDueSoon = !s.is_paused && diffDays >= 0 && diffDays <= 3;

    return (
      <Animated.View key={s.id} entering={FadeInDown.delay(index * 50).springify()} layout={Layout.springify()} style={[styles.card, s.is_paused ? { opacity: 0.6 } : null]}>
        <View style={styles.cardTop}>
          <View style={[styles.iconBg, { backgroundColor: safeAlpha(s.color, 0.15) }]}>
            <Ionicons name={s.icon as any || 'cash'} size={24} color={s.color || '#FFF'} />
          </View>
          <View style={styles.cardInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.name}>{s.name}</Text>
              {isDueSoon && (
                <View style={styles.dueSoonBadge}>
                  <Text style={styles.dueSoonText}>Due Soon</Text>
                </View>
              )}
            </View>
            <Text style={styles.cycleText}>
              {s.is_paused ? 'Paused' : `Repeats ${s.billing_cycle.toLowerCase()}`}
            </Text>
          </View>
          <Text style={[styles.amount, { color: s.type === 'INCOME' ? Colors.brand.mint : Colors.text.primary }]}>
            {s.type === 'INCOME' ? '+' : '-'}{formatMoney(s.amount)}
          </Text>
        </View>

        <View style={styles.divider} />
        
        <View style={styles.cardBottom}>
          <Text style={[styles.nextDate, s.is_paused ? { color: Colors.text.muted } : null]}>
            {s.is_paused ? 'Execution Paused' : `Next: ${dateStr}`}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              style={[styles.actionBtn, s.is_paused ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } : null]} 
              onPress={() => onTogglePause?.(s.id, !s.is_paused)}
            >
              <Ionicons name={s.is_paused ? "play" : "pause"} size={18} color={s.is_paused ? Colors.brand.mint : "#FFF"} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, { marginLeft: 8 }]} onPress={() => onEdit(s)}>
              <Ionicons name="ellipsis-horizontal" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Scheduled & Recurring</Text>
        <Text style={styles.subtitle}>Manage your automated transactions.</Text>
      </View>

      {/* Projection Widget */}
      <Animated.View entering={FadeInDown.springify()} style={styles.projectionCard}>
        <View style={styles.projRow}>
          <View style={styles.projCol}>
            <Text style={styles.projLabel}>Expected Inflow /mo</Text>
            <Text style={[styles.projValue, { color: Colors.brand.mint }]}>+{formatMoney(totalInflow)}</Text>
          </View>
          <View style={styles.projDivider} />
          <View style={styles.projCol}>
            <Text style={styles.projLabel}>Expected Outflow /mo</Text>
            <Text style={[styles.projValue, { color: Colors.brand.ruby }]}>-{formatMoney(totalOutflow)}</Text>
          </View>
        </View>
      </Animated.View>

      {subscriptions.length === 0 ? (
        <EmptyState 
          icon="calendar-outline" 
          title="No Active Schedules" 
          description="You don't have any recurring transactions set up yet." 
        />
      ) : (
        <>
          {expenses.length > 0 && (
            <View style={styles.groupSection}>
              <Text style={styles.groupTitle}>Expenses & Subscriptions</Text>
              {expenses.map((s, idx) => renderCard(s, idx))}
            </View>
          )}

          {incomes.length > 0 && (
            <View style={styles.groupSection}>
              <Text style={styles.groupTitle}>Incomes</Text>
              {incomes.map((s, idx) => renderCard(s, idx))}
            </View>
          )}
        </>
      )}

      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Ionicons name="add" size={20} color="#000" />
        <Text style={styles.addBtnText}>Create New Schedule</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  
  projectionCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  projRow: { flexDirection: 'row', alignItems: 'center' },
  projCol: { flex: 1, alignItems: 'center' },
  projLabel: { color: Colors.text.secondary, fontSize: 13, marginBottom: 8 },
  projValue: { fontSize: 18, fontWeight: '800' },
  projDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },

  groupSection: { marginBottom: 16 },
  groupTitle: { color: Colors.text.secondary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginTop: 8 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  name: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  dueSoonBadge: { backgroundColor: 'rgba(250, 204, 21, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  dueSoonText: { color: Colors.brand.yuzu, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cycleText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textTransform: 'capitalize' },
  amount: { fontSize: 18, fontWeight: '800' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextDate: { color: Colors.brand.yuzu, fontSize: 14, fontWeight: '600' },
  
  actionBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12 },
  
  addBtn: { flexDirection: 'row', backgroundColor: Colors.brand.yuzu, paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 16, marginLeft: 8 }
});

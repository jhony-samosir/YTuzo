import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { TouchableScale } from '../ui/TouchableScale';

interface QuickAction {
  id: string;
  action_id: string;
  slot_index: number;
  icon_name: any;
  icon_color: string;
  icon_bg: string;
  label_text: string;
}

export function QuickActionsGrid() {
  const db = useSQLiteContext();
  const [actions, setActions] = useState<QuickAction[]>([]);

  useEffect(() => {
    async function loadActions() {
      const result = await db.getAllAsync<QuickAction>('SELECT * FROM quick_actions_config ORDER BY slot_index ASC LIMIT 3');
      setActions(result);
    }
    loadActions();
  }, [db]);

  return (
    <View style={styles.gridContainer}>
      {actions.map((action) => (
        <TouchableScale 
          key={action.id} 
          style={styles.actionItem} 
          scaleTo={0.92}
          onPress={() => {
            if (action.action_id === 'ADD_EXPENSE') router.push('/finance');
            if (action.action_id === 'LOG_RUN') router.push('/sports');
            if (action.action_id === 'LOG_FUEL') router.push('/vehicle');
          }}
        >
          <View style={[styles.actionIconBg, { backgroundColor: action.icon_bg }]}>
            <Ionicons name={action.icon_name} size={28} color={action.icon_color} />
          </View>
          <Text style={styles.actionLabel}>{action.label_text}</Text>
        </TouchableScale>
      ))}

      {/* The 4th persistent "More" button */}
      <TouchableScale style={styles.actionItem} scaleTo={0.92} onPress={() => router.push('/modules' as any)}>
        <View style={[styles.actionIconBg, { backgroundColor: 'rgba(250, 250, 250, 0.1)' }]}>
          <Ionicons name="grid" size={28} color={Colors.text.primary} />
        </View>
        <Text style={styles.actionLabel}>More</Text>
      </TouchableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionIconBg: {
    width: 64,
    height: 64,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.faint,
  },
  actionLabel: {
    color: Colors.text.title,
    fontSize: 13,
    fontWeight: '600',
  },
});

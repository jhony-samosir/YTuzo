import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { financeStyles as styles } from './financeStyles';
import { EmptyState } from '../ui/EmptyState';
import { formatMoney, safeAlpha } from '../../utils/finance';
import { Budget } from '../../types/finance';

interface BudgetsTabProps {
  budgets: Budget[];
  onAdd?: () => void;
  onEdit?: (budget: Budget) => void;
}

export const BudgetsTab: React.FC<BudgetsTabProps> = ({ budgets, onAdd, onEdit }) => {
  if (budgets.length === 0) {
    return (
      <View style={styles.tabContent}>
        <EmptyState 
          icon="pie-chart-outline" 
          title="No Budgets Set" 
          description="Take control of your spending by creating monthly budgets."
          actionLabel="Create Budget"
          onAction={onAdd}
        />
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.budgetList}>
        {budgets.map(b => {
          const spent = b.spent || 0; 
          const rawProgress = (spent / (b.monthly_limit || 1)) * 100;
          const progress = Math.min(rawProgress, 100);
          
          const isOverBudget = rawProgress >= 100;
          const isNearBudget = rawProgress >= 80 && !isOverBudget;
          
          let progressColor = b.category_color;
          if (isOverBudget) progressColor = '#F43F5E'; // Ruby Red
          else if (isNearBudget) progressColor = '#F59E0B'; // Amber Warning
          
          return (
            <View key={b.id} style={[localStyles.budgetItem, isOverBudget && localStyles.budgetItemOver]}>
              <View style={localStyles.budgetHeader}>
                <View style={localStyles.budgetTitleRow}>
                  <View style={[localStyles.iconWrapper, { backgroundColor: safeAlpha(b.category_color, 0.15) }]}>
                    <Ionicons name={(b.category_icon || 'pie-chart') as any} size={18} color={b.category_color || '#FFF'} />
                  </View>
                  <Text style={localStyles.budgetName}>{b.category_name || 'Category'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[localStyles.budgetPercent, isOverBudget && { color: '#F43F5E' }]}>
                    {Math.round(rawProgress)}%
                  </Text>
                  {onEdit && (
                    <TouchableOpacity onPress={() => onEdit(b)} style={{ marginLeft: 12 }}>
                      <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <Text style={[localStyles.budgetAmount, isOverBudget && { color: '#F43F5E' }]}>
                {formatMoney(spent)} <Text style={localStyles.budgetLimit}>/ {formatMoney(b.monthly_limit)}</Text>
              </Text>

              <View style={localStyles.progressBarBg}>
                <View style={[localStyles.progressBarFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  budgetItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetName: {
    color: '#FAFAFA',
    fontSize: 17,
    fontWeight: '700',
  },
  budgetPercent: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '800',
  },
  budgetAmount: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  budgetLimit: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
    fontSize: 14,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  budgetItemOver: {
    borderColor: 'rgba(244, 63, 94, 0.3)',
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  }
});

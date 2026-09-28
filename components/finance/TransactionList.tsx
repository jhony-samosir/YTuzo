import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { financeStyles as styles } from './financeStyles';
import { Colors } from '../../constants/Colors';
import { EmptyState } from '../ui/EmptyState';
import { formatMoney } from '../../utils/finance';
import { Transaction } from '../../types/finance';

interface TransactionListProps {
  transactions: Transaction[];
  onItemClick: (tx: Transaction) => void;
  ListHeaderComponent: React.FC;
  startDate: Date | null;
  endDate: Date | null;
  currentMonth: Date;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onItemClick, 
  ListHeaderComponent, 
  startDate, 
  endDate, 
  currentMonth 
}) => {
  const flattenedData = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach(tx => {
      const date = new Date(tx.created_at);
      
      let dateStr = '';
      if (date.toDateString() === today.toDateString()) {
        dateStr = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateStr = 'Yesterday';
      } else {
        dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(tx);
    });

    const result: any[] = [];
    Object.keys(groups).forEach(dateStr => {
      result.push({ isHeader: true, id: `header-${dateStr}`, title: dateStr });
      groups[dateStr].forEach(tx => {
        result.push({ isHeader: false, ...tx });
      });
    });
    return result;
  }, [transactions]);

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    if (item.isHeader) {
      return (
        <Animated.View entering={FadeInDown.delay(Math.min(index * 20, 300)).springify()} style={localStyles.dateHeaderContainer}>
          <Text style={localStyles.dateHeader}>{item.title}</Text>
        </Animated.View>
      );
    }

    const tx = item as Transaction;
    const date = new Date(tx.created_at);
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 20, 300)).springify()}>
        <TouchableOpacity 
          key={tx.id}
          activeOpacity={0.7}
          onPress={() => onItemClick(tx)}
          style={localStyles.txItem}
        >
          <View style={styles.txLeft}>
            <View style={{ width: 4, height: 24, borderRadius: 2, backgroundColor: tx.color || '#FAFAFA', marginRight: 16 }} />
            <View>
              <Text style={localStyles.txTitle}>{tx.title}</Text>
              <Text style={localStyles.txSubtitle}>{timeStr} • {tx.subtitle}</Text>
            </View>
          </View>
          <Text style={[localStyles.txAmount, { color: tx.type === 'INCOME' ? '#10B981' : '#FAFAFA' }]}>
            {tx.type === 'INCOME' ? '+' : '-'}{formatMoney(tx.amount)}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const Empty = () => (
    <Animated.View entering={FadeInDown.delay(100)} style={{ marginTop: 40 }}>
      <EmptyState 
        icon="albums-outline" 
        title="No Transactions" 
        description={startDate && endDate 
          ? "No transactions found in this date range."
          : `No transactions found for ${currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.\nTap the + button below to add one.`}
      />
    </Animated.View>
  );

  return (
    <Animated.FlatList
      data={flattenedData}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={Empty}
      contentContainerStyle={[styles.tabContent, styles.txListContainer, { paddingBottom: 160 }]}
      showsVerticalScrollIndicator={false}
      initialNumToRender={15}
      itemLayoutAnimation={Layout.springify()}
    />
  );
};

const localStyles = StyleSheet.create({
  dateHeaderContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  txTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  txSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
});

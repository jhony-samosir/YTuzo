import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Transaction } from '../../types/finance';
import { TouchableScale } from '../../components/ui/TouchableScale';

import { TransactionList } from './TransactionList';
import { TransactionDetailModal } from './TransactionDetailModal';
import { DateRangeModal } from './DateRangeModal';
import { ConfirmModal } from './ConfirmModal';

interface TransactionsTabProps {
  globalTransactions: Transaction[];
  fetchFilteredTransactions: (filters: { type?: string, startDate?: number, endDate?: number, month?: number, year?: number }) => Promise<Transaction[]>;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
}

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ 
  globalTransactions, 
  fetchFilteredTransactions, 
  onDeleteTransaction, 
  onEditTransaction 
}) => {
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Custom Detail Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Delete Confirmation State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

  // Date Range State
  const [rangeModalVisible, setRangeModalVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      type FilterParams = Parameters<typeof fetchFilteredTransactions>[0];
      const filters: FilterParams = { type: filter };
      if (startDate && endDate) {
        filters.startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        // Set end time to the end of the day
        filters.endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime();
      } else {
        filters.month = currentMonth.getMonth();
        filters.year = currentMonth.getFullYear();
      }
      const result = await fetchFilteredTransactions(filters);
      if (active) setLocalTransactions(result);
    };
    fetch();
    return () => { active = false; };
  }, [filter, currentMonth, startDate, endDate, globalTransactions, fetchFilteredTransactions]);

  const prevMonth = () => {
    setStartDate(null); setEndDate(null);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setStartDate(null); setEndDate(null);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleItemClick = (tx: Transaction) => {
    setSelectedTx(tx);
    setDetailModalVisible(true);
  };

  const handleDeleteClick = (id: string) => {
    setTxToDelete(id);
    setDeleteConfirmVisible(true);
  };

  const executeDelete = () => {
    if (txToDelete) {
      setDeleteConfirmVisible(false);
      setDetailModalVisible(false);
      onDeleteTransaction(txToDelete);
      setTxToDelete(null);
    }
  };

  const handleDayPress = (selectedDate: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else {
      setEndDate(selectedDate);
    }
  };

  const renderListHeader = () => (
    <View style={localStyles.headerContainer}>
      {/* Month Selector */}
      <View style={localStyles.monthSelector}>
        <TouchableOpacity onPress={prevMonth} style={localStyles.monthBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setRangeModalVisible(true)} style={localStyles.monthTextContainer}>
          <Text style={localStyles.monthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          {(startDate || endDate) && <View style={localStyles.activeRangeDot} />}
          <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.5)" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={nextMonth} style={localStyles.monthBtn}>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={localStyles.filterContainer}>
        {(['ALL', 'INCOME', 'EXPENSE'] as FilterType[]).map(f => (
          <TouchableScale 
            key={f}
            scaleTo={0.92}
            onPress={() => setFilter(f)}
            style={[localStyles.filterChip, filter === f && localStyles.filterChipActive]}
          >
            <Text style={[localStyles.filterChipText, filter === f && localStyles.filterChipTextActive]}>
              {f === 'ALL' ? 'All' : f === 'INCOME' ? 'Income' : 'Expense'}
            </Text>
          </TouchableScale>
        ))}
      </View>
    </View>
  );

  return (
    <>
      <TransactionList
        transactions={localTransactions}
        onItemClick={handleItemClick}
        ListHeaderComponent={renderListHeader}
        startDate={startDate}
        endDate={endDate}
        currentMonth={currentMonth}
      />

      <TransactionDetailModal
        visible={detailModalVisible}
        transaction={selectedTx}
        onClose={() => setDetailModalVisible(false)}
        onEdit={onEditTransaction}
        onDeleteClick={handleDeleteClick}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        type="danger"
      />

      <DateRangeModal
        visible={rangeModalVisible}
        startDate={startDate}
        endDate={endDate}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        onDayPress={handleDayPress}
        onClose={() => setRangeModalVisible(false)}
        onClear={() => { setStartDate(null); setEndDate(null); setRangeModalVisible(false); }}
      />
    </>
  );
};

const localStyles = StyleSheet.create({
  headerContainer: {
    marginBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 20,
    marginTop: 8,
  },
  monthBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  monthTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  monthText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeRangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand.yuzu,
    marginLeft: 6,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 6,
    alignSelf: 'center',
  },
  filterChip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  filterChipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  filterChipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
});

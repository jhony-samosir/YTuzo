import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { financeStyles as styles } from './financeStyles';
import { Colors } from '../../constants/Colors';
import { EmptyState } from '../ui/EmptyState';
import { formatMoney } from '../../utils/finance';
import { Transaction } from '../../types/finance';
import { TouchableScale } from '../../components/ui/TouchableScale';

interface TransactionsTabProps {
  globalTransactions: Transaction[];
  fetchFilteredTransactions: (filters: { type?: string, startDate?: number, endDate?: number, month?: number, year?: number }) => Promise<Transaction[]>;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
}

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ globalTransactions, fetchFilteredTransactions, onDeleteTransaction, onEditTransaction }) => {
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Custom Detail Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Delete Confirmation State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);

  const [rangeModalVisible, setRangeModalVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [calendarMode, setCalendarMode] = useState<'DATE' | 'MONTH'>('DATE');

  const prevMonth = () => {
    setStartDate(null); setEndDate(null);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setStartDate(null); setEndDate(null);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  React.useEffect(() => {
    let active = true;
    const fetch = async () => {
      const filters: any = { type: filter };
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

  const flattenedData = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    localTransactions.forEach(tx => {
      const date = new Date(tx.created_at);
      
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
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
  }, [localTransactions]);

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

  const handleItemClick = (tx: Transaction) => {
    setSelectedTx(tx);
    setDetailModalVisible(true);
  };

  const handleDayPress = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else {
      setEndDate(selectedDate);
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    if (calendarMode === 'MONTH') {
      return (
        <View style={localStyles.calContainer}>
          <View style={localStyles.calNavRow}>
            <TouchableOpacity onPress={() => setCurrentMonth(new Date(year - 1, month, 1))}>
              <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCalendarMode('DATE')}>
              <Text style={localStyles.calMonthNavText}>{year}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentMonth(new Date(year + 1, month, 1))}>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={localStyles.calGrid}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
              <TouchableOpacity 
                key={m} 
                style={[localStyles.calMonthBtn, month === idx && localStyles.calDaySelected]}
                onPress={() => {
                  setCurrentMonth(new Date(year, idx, 1));
                  setCalendarMode('DATE');
                }}
              >
                <Text style={[localStyles.calMonthBtnText, month === idx && localStyles.calDayTextSelected]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={localStyles.calDay} />);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const thisDate = new Date(year, month, i).getTime();
      const sTime = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime() : null;
      const eTime = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime() : null;
      
      let isSelected = false;
      let isBetween = false;
      
      if (sTime !== null && eTime !== null) {
        const minTime = Math.min(sTime, eTime);
        const maxTime = Math.max(sTime, eTime);
        isSelected = thisDate === minTime || thisDate === maxTime;
        isBetween = thisDate > minTime && thisDate < maxTime;
      } else if (sTime !== null) {
        isSelected = thisDate === sTime;
      }
      
      days.push(
        <TouchableOpacity 
          key={`day-${i}`} 
          style={[
            localStyles.calDay, 
            isBetween && localStyles.calDayBetween,
            isSelected && localStyles.calDaySelected
          ]}
          onPress={() => handleDayPress(i)}
        >
          <Text style={[
            localStyles.calDayText, 
            isSelected && localStyles.calDayTextSelected,
            isBetween && localStyles.calDayTextBetween
          ]}>{i}</Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={localStyles.calContainer}>
        <View style={localStyles.calNavRow}>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCalendarMode('MONTH')}>
            <Text style={localStyles.calMonthNavText}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={localStyles.calHeaderRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
            <Text key={`dw-${idx}`} style={localStyles.calHeaderText}>{d}</Text>
          ))}
        </View>
        <View style={localStyles.calGrid}>{days}</View>
      </View>
    );
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
          onPress={() => handleItemClick(tx)}
          style={localStyles.txItem}
        >
          <View style={styles.txLeft}>
            {/* Minimal colored bar indicator instead of large icon */}
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

  const ListEmptyComponent = () => (
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
    <>
      <Animated.FlatList
        data={flattenedData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={[styles.tabContent, styles.txListContainer, { paddingBottom: 160 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        itemLayoutAnimation={Layout.springify()}
      />

      {/* Premium Detail Modal */}
      {detailModalVisible && (
        <Modal visible={detailModalVisible} animationType="slide" transparent onRequestClose={() => setDetailModalVisible(false)}>
          <View style={localStyles.modalOverlay}>
            <View style={localStyles.modalContent}>
              {selectedTx && (
                <>
                  <View style={localStyles.modalHeader}>
                    <Text style={localStyles.modalTitle}>Transaction Detail</Text>
                    <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={localStyles.closeBtn}>
                      <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                  </View>

                  <View style={localStyles.detailCard}>
                    <Text style={[localStyles.detailAmount, { color: selectedTx.type === 'INCOME' ? Colors.brand.mint : Colors.brand.ruby }]}>
                      {selectedTx.type === 'INCOME' ? '+' : '-'}{formatMoney(selectedTx.amount)}
                    </Text>
                    <Text style={localStyles.detailTxTitle}>{selectedTx.title}</Text>
                    
                    <View style={localStyles.detailRow}>
                      <Text style={localStyles.detailLabel}>Type</Text>
                      <Text style={[localStyles.detailValue, { color: selectedTx.type === 'INCOME' ? Colors.brand.mint : Colors.brand.ruby }]}>
                        {selectedTx.type === 'INCOME' ? 'Income' : 'Expense'}
                      </Text>
                    </View>
                    <View style={localStyles.detailRow}>
                      <Text style={localStyles.detailLabel}>Date</Text>
                      <Text style={localStyles.detailValue}>
                        {new Date(selectedTx.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </Text>
                    </View>
                    <View style={localStyles.detailRow}>
                      <Text style={localStyles.detailLabel}>Category</Text>
                      <Text style={localStyles.detailValue}>{selectedTx.subtitle}</Text>
                    </View>
                  </View>

                  <View style={localStyles.modalActions}>
                    {selectedTx.subtitle !== 'Scheduled' && (
                      <TouchableOpacity 
                        style={localStyles.actionEditBtn} 
                        onPress={() => {
                          setDetailModalVisible(false);
                          onEditTransaction(selectedTx);
                        }}
                      >
                        <Ionicons name="pencil" size={20} color="#000" />
                        <Text style={localStyles.actionEditText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={[localStyles.actionDeleteBtn, selectedTx.subtitle === 'Scheduled' && { flex: 1, paddingVertical: 16, flexDirection: 'row' }]} 
                      onPress={() => handleDeleteClick(selectedTx.id)}
                    >
                      <Ionicons name="trash" size={20} color={Colors.brand.ruby} />
                      {selectedTx.subtitle === 'Scheduled' && (
                        <Text style={{ color: Colors.brand.ruby, fontWeight: '700', fontSize: 16, marginLeft: 8 }}>Delete</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmVisible && (
        <Modal visible={deleteConfirmVisible} animationType="fade" transparent onRequestClose={() => setDeleteConfirmVisible(false)}>
          <View style={[localStyles.modalOverlay, { justifyContent: 'center', padding: 24 }]}>
            <Animated.View entering={FadeInDown.springify()} style={localStyles.confirmModalContent}>
              <View style={localStyles.confirmIconContainer}>
                <Ionicons name="trash-outline" size={32} color={Colors.brand.ruby} />
              </View>
              <Text style={localStyles.confirmTitle}>Delete Transaction</Text>
              <Text style={localStyles.confirmDesc}>Are you sure you want to delete this transaction? This action cannot be undone.</Text>
              
              <View style={localStyles.confirmActions}>
                <TouchableOpacity 
                  style={localStyles.confirmCancelBtn} 
                  onPress={() => setDeleteConfirmVisible(false)}
                >
                  <Text style={localStyles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={localStyles.confirmDeleteBtn} 
                  onPress={executeDelete}
                >
                  <Text style={localStyles.confirmDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Date Range Modal */}
      {rangeModalVisible && (
        <Modal visible={rangeModalVisible} animationType="slide" transparent onRequestClose={() => setRangeModalVisible(false)}>
          <View style={localStyles.modalOverlay}>
            <View style={localStyles.modalContent}>
              <View style={localStyles.modalHeader}>
                <Text style={localStyles.modalTitle}>Select Date Range</Text>
                <TouchableOpacity onPress={() => setRangeModalVisible(false)} style={localStyles.closeBtn}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <Text style={localStyles.rangeIndicatorText}>
                {startDate && endDate 
                  ? `${startDate.getDate()} ${startDate.toLocaleDateString('en-US', {month: 'short'})} - ${endDate.getDate()} ${endDate.toLocaleDateString('en-US', {month: 'short'})}`
                  : startDate 
                    ? "Select end date..." 
                    : "Select start date..."
                }
              </Text>

              {renderCalendar()}

              <View style={[localStyles.modalActions, { marginTop: 24 }]}>
                <TouchableOpacity 
                  style={[localStyles.actionEditBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]} 
                  onPress={() => { setStartDate(null); setEndDate(null); setRangeModalVisible(false); }}
                >
                  <Text style={[localStyles.actionEditText, { color: '#FFF' }]}>Clear</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[localStyles.actionEditBtn, { marginRight: 0, opacity: (!startDate || !endDate) ? 0.5 : 1 }]} 
                  disabled={!startDate || !endDate}
                  onPress={() => setRangeModalVisible(false)}
                >
                  <Text style={localStyles.actionEditText}>Apply Filter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40, 
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  detailAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  detailTxTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 24,
  },
  detailRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionEditBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.brand.yuzu,
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionEditText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  actionDeleteBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  /* Confirm Modal */
  confirmModalContent: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.brand.ruby,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  /* Calendar Styles */
  calContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    padding: 16,
  },
  calNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calMonthNavText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  calHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  calHeaderText: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calDay: {
    width: '14.28%', // 100 / 7
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 20,
  },
  calDayText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  calDaySelected: {
    backgroundColor: Colors.brand.yuzu,
  },
  calDayTextSelected: {
    color: '#000',
    fontWeight: '800',
  },
  calDayBetween: {
    backgroundColor: 'rgba(224, 255, 49, 0.15)',
    borderRadius: 0,
  },
  calDayTextBetween: {
    color: Colors.brand.yuzu,
  },
  rangeIndicatorText: {
    color: Colors.brand.yuzu,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  calMonthBtn: {
    width: '33.33%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginVertical: 4,
  },
  calMonthBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  }
});

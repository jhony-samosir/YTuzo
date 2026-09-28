import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Subscription, Wallet } from '../../types/finance';
import { ConfirmModal } from './ConfirmModal';
import { CalendarPicker } from '../ui/CalendarPicker';

interface ScheduleFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Subscription>) => void;
  onDelete?: (id: string) => void;
  initialData?: Subscription | null;
  wallets?: Wallet[];
}

export const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({ visible, onClose, onSave, onDelete, initialData, wallets = [] }) => {
  const [name, setName] = useState(initialData ? initialData.name : '');
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(initialData ? initialData.type : 'EXPENSE');
  const [billingCycle, setBillingCycle] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>(initialData ? initialData.billing_cycle : 'MONTHLY');
  const [selectedWalletId, setSelectedWalletId] = useState(initialData?.wallet_id || (wallets.length > 0 ? wallets[0].id : 'w-1'));
  const [selectedDate, setSelectedDate] = useState<Date>(initialData ? new Date(initialData.next_billing_date) : new Date());
  
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(selectedDate));

  const handleSave = () => {
    setErrorMsg('');
    if (!name.trim() || !amount.trim()) {
      setErrorMsg('Please enter a valid name and amount.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Amount must be a positive number.');
      return;
    }

    onSave({
      name: name.trim(),
      amount: parsedAmount,
      type: type,
      billing_cycle: billingCycle,
      next_billing_date: selectedDate.getTime(),
      icon: initialData?.icon || (type === 'INCOME' ? 'briefcase' : 'calendar'),
      color: initialData?.color || (type === 'INCOME' ? '#10B981' : '#F43F5E'),
      wallet_id: selectedWalletId,
    });
    onClose();
  };

  const renderCalendar = () => {
    return (
      <View style={{ marginBottom: 24 }}>
        <CalendarPicker 
          startDate={selectedDate} 
          currentMonth={calendarMonth} 
          setCurrentMonth={setCalendarMonth} 
          onDayPress={(date) => {
            setSelectedDate(date);
            setShowCalendar(false);
          }} 
        />
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{initialData ? 'Edit Schedule' : 'New Schedule'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'EXPENSE' && styles.typeBtnExpense]}
                onPress={() => setType('EXPENSE')}
              >
                <Text style={[styles.typeBtnText, type === 'EXPENSE' && styles.typeBtnTextActive]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'INCOME' && styles.typeBtnIncome]}
                onPress={() => setType('INCOME')}
              >
                <Text style={[styles.typeBtnText, type === 'INCOME' && styles.typeBtnTextActive]}>Income</Text>
              </TouchableOpacity>
            </View>

            {/* Wallet Picker */}
            <Text style={styles.label}>Account / Wallet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
              {wallets.map(w => (
                <TouchableOpacity 
                  key={w.id} 
                  style={[styles.pickerItem, selectedWalletId === w.id && { borderColor: w.color_theme, backgroundColor: w.color_theme + '20' }]}
                  onPress={() => setSelectedWalletId(w.id)}
                >
                  <Ionicons name={w.type === 'BANK' ? 'card' : w.type === 'CASH' ? 'cash' : 'wallet'} size={20} color={selectedWalletId === w.id ? w.color_theme : Colors.text.muted} />
                  <Text style={[styles.pickerText, selectedWalletId === w.id && { color: w.color_theme, fontWeight: '700' }]}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Form Inputs */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 12 }]}>
                <Text style={styles.label}>Amount</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.text.muted}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 3 }]}>
                <Text style={styles.label}>Name</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. Salary, Rent"
                  placeholderTextColor={Colors.text.muted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Date Pill */}
            <View style={styles.dateRow}>
              <Text style={styles.label}>Start / Next Date</Text>
              <TouchableOpacity 
                style={styles.datePill}
                onPress={() => setShowCalendar(!showCalendar)}
              >
                <Ionicons name="calendar" size={16} color={Colors.brand.yuzu} />
                <Text style={styles.datePillText}>
                  {selectedDate.getDate() === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear() 
                    ? `Today, ${selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
                    : selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Ionicons name={showCalendar ? "chevron-up" : "chevron-down"} size={16} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>

            {/* Collapsible Calendar */}
            {showCalendar && renderCalendar()}

            {/* Billing Cycle Picker */}
            <Text style={styles.label}>Repeats Every</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map(cycle => (
                <TouchableOpacity 
                  key={cycle} 
                  style={[styles.pickerItem, billingCycle === cycle && { borderColor: Colors.brand.yuzu, backgroundColor: Colors.brand.yuzu + '20' }]}
                  onPress={() => setBillingCycle(cycle)}
                >
                  <Text style={[styles.pickerText, billingCycle === cycle && { color: Colors.brand.yuzu, fontWeight: '700' }]}>
                    {cycle.charAt(0) + cycle.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color={Colors.brand.ruby} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{initialData ? 'Update Schedule' : 'Create Schedule'}</Text>
            </TouchableOpacity>

            {/* Delete Button (Only in Edit Mode) */}
            {initialData && onDelete && (
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => setDeleteConfirmVisible(true)}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.brand.ruby} />
                <Text style={styles.deleteBtnText}>Delete Schedule</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Modal */}
      {initialData && onDelete && (
        <ConfirmModal 
          visible={deleteConfirmVisible}
          title="Delete Schedule"
          description="Are you sure you want to stop this recurring schedule? This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => {
            setDeleteConfirmVisible(false);
            onDelete(initialData.id);
            onClose();
          }}
          onCancel={() => setDeleteConfirmVisible(false)}
          type="danger"
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  typeBtnExpense: {
    backgroundColor: Colors.brand.ruby,
  },
  typeBtnIncome: {
    backgroundColor: Colors.brand.mint,
  },
  typeBtnText: {
    color: Colors.text.secondary,
    fontWeight: '600',
    fontSize: 15,
  },
  typeBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  pickerScroll: {
    marginBottom: 24,
  },
  pickerContent: {
    paddingRight: 24,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
  },
  pickerText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  inputGroup: {},
  label: {
    color: Colors.text.secondary,
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    color: Colors.text.primary,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: Colors.brand.yuzu,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
  },
  deleteBtnText: {
    color: Colors.brand.ruby,
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.brand.ruby,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  datePillText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  calContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  calHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calMonthText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  calDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calHeaderText: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
    fontSize: 13,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 18,
  },
  calDayText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  calDaySelected: {
    backgroundColor: Colors.brand.yuzu,
  },
  calDayTextSelected: {
    color: '#000',
    fontWeight: '800',
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

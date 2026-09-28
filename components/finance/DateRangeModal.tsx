import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { CalendarPicker } from '../ui/CalendarPicker';

interface DateRangeModalProps {
  visible: boolean;
  startDate: Date | null;
  endDate: Date | null;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onDayPress: (date: Date) => void;
  onClose: () => void;
  onClear: () => void;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({ 
  visible, 
  startDate, 
  endDate, 
  currentMonth,
  setCurrentMonth,
  onDayPress,
  onClose,
  onClear
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.rangeIndicatorText}>
            {startDate && endDate 
              ? `${startDate.getDate()} ${startDate.toLocaleDateString('en-US', {month: 'short'})} - ${endDate.getDate()} ${endDate.toLocaleDateString('en-US', {month: 'short'})}`
              : startDate 
                ? "Select end date..." 
                : "Select start date..."
            }
          </Text>

          <CalendarPicker
            startDate={startDate}
            endDate={endDate}
            mode="range"
            onDayPress={onDayPress}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
          />

          <View style={[styles.modalActions, { marginTop: 24 }]}>
            <TouchableOpacity 
              style={[styles.actionEditBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]} 
              onPress={onClear}
            >
              <Text style={[styles.actionEditText, { color: '#FFF' }]}>Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionEditBtn, { marginRight: 0, opacity: (!startDate || !endDate) ? 0.5 : 1 }]} 
              disabled={!startDate || !endDate}
              onPress={onClose}
            >
              <Text style={styles.actionEditText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  rangeIndicatorText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
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
  },
});

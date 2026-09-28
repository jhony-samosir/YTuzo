import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { formatMoney } from '../../utils/finance';
import { Transaction } from '../../types/finance';

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDeleteClick: (id: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ visible, transaction, onClose, onEdit, onDeleteClick }) => {
  if (!transaction) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Transaction Detail</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailCard}>
            <Text style={[styles.detailAmount, { color: transaction.type === 'INCOME' ? Colors.brand.mint : Colors.brand.ruby }]}>
              {transaction.type === 'INCOME' ? '+' : '-'}{formatMoney(transaction.amount)}
            </Text>
            <Text style={styles.detailTxTitle}>{transaction.title}</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={[styles.detailValue, { color: transaction.type === 'INCOME' ? Colors.brand.mint : Colors.brand.ruby }]}>
                {transaction.type === 'INCOME' ? 'Income' : 'Expense'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(transaction.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{transaction.subtitle}</Text>
            </View>
          </View>

          <View style={styles.modalActions}>
            {transaction.subtitle !== 'Scheduled' && (
              <TouchableOpacity 
                style={styles.actionEditBtn} 
                onPress={() => {
                  onClose();
                  onEdit(transaction);
                }}
              >
                <Ionicons name="pencil" size={20} color="#000" />
                <Text style={styles.actionEditText}>Edit</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionDeleteBtn, transaction.subtitle === 'Scheduled' && { flex: 1, paddingVertical: 16, flexDirection: 'row' }]} 
              onPress={() => onDeleteClick(transaction.id)}
            >
              <Ionicons name="trash" size={20} color={Colors.brand.ruby} />
              {transaction.subtitle === 'Scheduled' && (
                <Text style={{ color: Colors.brand.ruby, fontWeight: '700', fontSize: 16, marginLeft: 8 }}>Delete</Text>
              )}
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
});

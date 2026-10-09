import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Budget, Category } from '../../types/finance';


interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { category_id: string; monthly_limit: number }) => void;
  onDelete?: (id: string) => void;
  onAddCategory?: (data: { name: string; color: string; icon: string; parent_id?: string }) => void;
  onManageCategories?: () => void;
  initialData?: Budget | null;
  categories?: Category[];
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ 
  visible, 
  onClose, 
  onSave, 
  onDelete,
  onAddCategory,
  onManageCategories,
  initialData, 
  categories = [] 
}) => {
  const [limit, setLimit] = useState(initialData ? initialData.monthly_limit.toString() : '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.category_id || (categories.length > 0 ? categories[0].id : 'cat-1'));
  const [errorMsg, setErrorMsg] = useState('');


  const handleSave = () => {
    setErrorMsg('');
    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setErrorMsg('Monthly limit must be a positive number.');
      return;
    }

    onSave({
      category_id: selectedCategoryId,
      monthly_limit: parsedLimit,
    });
    onClose();
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
      onClose();
    }
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
            <Text style={styles.headerTitle}>{initialData ? 'Edit Budget' : 'New Budget'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Category Picker */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { marginBottom: 0 }]}>Category / Sub-Category</Text>
              {onManageCategories && (
                <TouchableOpacity onPress={() => { onClose(); onManageCategories(); }}>
                  <Text style={styles.manageLink}>Edit Categories</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>

              {categories.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.pickerItem, selectedCategoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '20' }]}
                  onPress={() => setSelectedCategoryId(c.id)}
                >
                  <Ionicons name={c.icon as any} size={20} color={selectedCategoryId === c.id ? c.color : Colors.text.muted} />
                  <Text style={[styles.pickerText, selectedCategoryId === c.id && { color: c.color, fontWeight: '700' }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}

            </ScrollView>

            {/* Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Limit</Text>
              <TextInput 
                style={styles.input}
                placeholder="0"
                placeholderTextColor={Colors.text.muted}
                value={limit}
                onChangeText={setLimit}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color={Colors.brand.ruby} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{initialData ? 'Update Budget' : 'Add Budget'}</Text>
            </TouchableOpacity>

            {/* Delete Button */}
            {initialData && onDelete && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color={Colors.brand.ruby} />
                <Text style={styles.deleteBtnText}>Delete Budget</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  pickerText: {
    color: Colors.text.secondary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageLink: {
    color: Colors.brand.yuzu,
    fontSize: 13,
    fontWeight: '600',
  },
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 16,
  },
  deleteBtnText: {
    color: Colors.brand.ruby,
    fontWeight: '600',
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
  }
});

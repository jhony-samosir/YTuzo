import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Category } from '../../types/finance';
import { CreateCategoryModal } from './CreateCategoryModal';
import { DEFAULT_CATEGORY_ID } from '../../constants/defaults';

interface ManageCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (data: { name: string; color: string; icon: string; parent_id?: string }) => void;
  onUpdateCategory: (id: string, data: Partial<Category>) => void;
  onDeleteCategory: (id: string, fallbackId: string) => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ 
  visible, onClose, categories, onAddCategory, onUpdateCategory, onDeleteCategory 
}) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  
  // Group categories
  const parents = categories.filter(c => !c.parent_id);
  const children = categories.filter(c => c.parent_id);

  const handleCreateOrEdit = (data: { name: string; color: string; icon: string; parent_id?: string }) => {
    if (editingCat) {
      onUpdateCategory(editingCat.id, data);
    } else {
      onAddCategory(data);
    }
  };

  const openEdit = (c: Category) => {
    setEditingCat(c);
    setIsFormVisible(true);
  };

  const openAdd = () => {
    setEditingCat(null);
    setIsFormVisible(true);
  };

  const confirmDelete = (c: Category) => {
    if (c.id === DEFAULT_CATEGORY_ID) {
      Alert.alert('Restricted', 'The default category cannot be deleted.');
      return;
    }
    
    Alert.alert(
      'Delete Category?',
      `Are you sure you want to delete "${c.name}"? Transactions and budgets associated with it will be reassigned to the Default Category or deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteCategory(c.id, DEFAULT_CATEGORY_ID) }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Categories</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          {parents.map(parent => (
            <View key={parent.id} style={styles.categoryBlock}>
              <View style={styles.parentRow}>
                <View style={[styles.iconBox, { backgroundColor: parent.color + '20' }]}>
                  <Ionicons name={parent.icon as any} size={20} color={parent.color} />
                </View>
                <Text style={styles.catName}>{parent.name}</Text>
                
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => openEdit(parent)} style={styles.actionBtn}>
                    <Ionicons name="pencil" size={18} color={Colors.text.muted} />
                  </TouchableOpacity>
                  {parent.id !== DEFAULT_CATEGORY_ID && (
                    <TouchableOpacity onPress={() => confirmDelete(parent)} style={styles.actionBtn}>
                      <Ionicons name="trash" size={18} color={Colors.brand.ruby} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Render Children */}
              {children.filter(c => c.parent_id === parent.id).map(child => (
                <View key={child.id} style={styles.childRow}>
                  <View style={styles.childLine} />
                  <View style={[styles.iconBox, { backgroundColor: child.color + '20', width: 32, height: 32 }]}>
                    <Ionicons name={child.icon as any} size={16} color={child.color} />
                  </View>
                  <Text style={[styles.catName, { fontSize: 15 }]}>{child.name}</Text>
                  
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openEdit(child)} style={styles.actionBtn}>
                      <Ionicons name="pencil" size={16} color={Colors.text.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(child)} style={styles.actionBtn}>
                      <Ionicons name="trash" size={16} color={Colors.brand.ruby} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Ionicons name="add" size={24} color="#000" />
          <Text style={styles.fabText}>Add Category</Text>
        </TouchableOpacity>

      </View>

      <CreateCategoryModal 
        visible={isFormVisible} 
        onClose={() => setIsFormVisible(false)}
        onSave={handleCreateOrEdit}
        initialData={editingCat}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  categoryBlock: {
    marginBottom: 24,
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingRight: 16,
  },
  childLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
    marginLeft: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    backgroundColor: Colors.brand.yuzu,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: Colors.brand.yuzu,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  }
});

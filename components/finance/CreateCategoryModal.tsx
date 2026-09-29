import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Category } from '../../types/finance';

interface CreateCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string; icon: string; parent_id?: string }) => void;
  parentCategoryId?: string;
  initialData?: Category | null;
}

const PRESET_COLORS = ['#38BDF8', '#F43F5E', '#FACC15', '#10B981', '#A855F7', '#FB923C'];
const PRESET_ICONS = ['folder', 'cart', 'restaurant', 'airplane', 'car', 'gift', 'game-controller', 'briefcase', 'home', 'medkit'];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ visible, onClose, onSave, parentCategoryId, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || PRESET_COLORS[0]);
  const [icon, setIcon] = useState(initialData?.icon || PRESET_ICONS[0]);

  // Update state when initialData changes or modal becomes visible
  React.useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(initialData?.name || '');
      setColor(initialData?.color || PRESET_COLORS[0]);
      setIcon(initialData?.icon || PRESET_ICONS[0]);
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, icon, parent_id: parentCategoryId });
    onClose();
    setName('');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>
            {initialData ? 'Edit Category' : (parentCategoryId ? 'New Sub-Category' : 'New Category')}
          </Text>
          
          <TextInput 
            style={styles.input}
            placeholder="Category Name"
            placeholderTextColor={Colors.text.muted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={styles.label}>Color</Text>
          <View style={styles.row}>
            {PRESET_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorBubble, { backgroundColor: c }, color === c && styles.selectedRing]} />
            ))}
          </View>

          <Text style={styles.label}>Icon</Text>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {PRESET_ICONS.map(i => (
              <TouchableOpacity key={i} onPress={() => setIcon(i)} style={[styles.iconBubble, icon === i && { backgroundColor: color + '30', borderColor: color }]}>
                <Ionicons name={i as any} size={24} color={icon === i ? color : Colors.text.muted} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: color }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    color: Colors.text.primary,
    fontSize: 16,
    marginBottom: 20,
  },
  label: {
    color: Colors.text.secondary,
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  colorBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  selectedRing: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cancelBtnText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
  },
});

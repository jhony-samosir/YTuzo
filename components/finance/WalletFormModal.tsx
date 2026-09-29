import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Wallet } from '../../types/finance';
import { formatMoney } from '../../utils/finance';
import { LinearGradient } from 'expo-linear-gradient';

interface WalletFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Wallet, 'id' | 'currency' | 'balance'> & { balance?: number }) => void;
  initialData?: Wallet | null;
}

const WALLET_TYPES = [
  { id: 'BANK', label: 'Bank', icon: 'library' },
  { id: 'E-WALLET', label: 'E-Wallet', icon: 'phone-portrait' },
  { id: 'CASH', label: 'Cash', icon: 'cash' },
  { id: 'CREDIT', label: 'Credit', icon: 'card' },
  { id: 'INVEST', label: 'Invest', icon: 'trending-up' }
];
const PRESET_COLORS = ['#38BDF8', '#F43F5E', '#FACC15', '#10B981', '#A855F7', '#FB923C'];

export const WalletFormModal: React.FC<WalletFormModalProps> = ({ 
  visible, onClose, onSave, initialData 
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (visible) {
      setName(initialData?.name || '');
      setType(initialData?.type || 'BANK');
      setBalance(initialData ? '' : ''); // We disable balance editing in update
      setColor(initialData?.color_theme || PRESET_COLORS[0]);
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name,
      type: type as Wallet['type'],
      color_theme: color,
      ...(initialData ? {} : { balance: parseFloat(balance || '0') })
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{initialData ? 'Edit Wallet' : 'New Wallet'}</Text>
          
          {/* Live Preview Card */}
          <View style={[styles.cardContainer, { shadowColor: color }]}>
            <LinearGradient
              colors={[color, '#000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Top */}
              <View style={styles.cardTopRow}>
                <Text style={styles.cardLogoText}>{type}</Text>
              </View>

              {/* Middle */}
              <View style={styles.cardMiddleRow}>
                {(type === 'BANK' || type === 'CREDIT') && (
                  <>
                    <View style={styles.simulatedChip}>
                      <View style={styles.chipLine} />
                      <View style={styles.chipLine} />
                    </View>
                    <Ionicons name="wifi" size={28} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
                  </>
                )}
                {type === 'E-WALLET' && <Ionicons name="qr-code-outline" size={32} color="rgba(255,255,255,0.6)" />}
                {type === 'CASH' && <Ionicons name="wallet-outline" size={32} color="rgba(255,255,255,0.6)" />}
                {type === 'INVEST' && <Ionicons name="trending-up-outline" size={32} color="rgba(255,255,255,0.6)" />}
              </View>

              {/* Bottom */}
              <View style={styles.cardBottomRow}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={styles.cardLabel}>WALLET NAME</Text>
                  <Text style={styles.cardName} numberOfLines={1}>{name || 'YOUR WALLET'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardLabel}>{type === 'CREDIT' ? 'BILLED' : 'BALANCE'}</Text>
                  <Text style={styles.cardBalance}>
                    {initialData ? formatMoney(initialData.balance) : formatMoney(parseFloat(balance || '0'))}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name Input */}
            <TextInput 
              style={styles.input}
              placeholder="Wallet Name (e.g. BCA, Cash)"
              placeholderTextColor={Colors.text.muted}
              value={name}
              onChangeText={setName}
            />

            {/* Initial Balance Input (Only on Create) */}
            {!initialData && (
              <TextInput 
                style={[styles.input, { marginTop: 16 }]}
                placeholder="Initial Balance (e.g. 1000000)"
                placeholderTextColor={Colors.text.muted}
                value={balance}
                onChangeText={setBalance}
                keyboardType="decimal-pad"
              />
            )}
            {initialData && (
              <Text style={styles.noteText}>Balance can only be modified through transactions (Income/Expense/Transfer) for tracking accuracy.</Text>
            )}

            {/* Type Picker */}
            <Text style={styles.sectionTitle}>Wallet Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
              {WALLET_TYPES.map(t => (
                <TouchableOpacity 
                  key={t.id}
                  style={[styles.typeBtn, type === t.id && { backgroundColor: Colors.brand.yuzu, borderColor: Colors.brand.yuzu }]}
                  onPress={() => setType(t.id)}
                >
                  <Ionicons name={t.icon as any} size={20} color={type === t.id ? '#000' : Colors.text.muted} />
                  <Text style={[styles.typeText, type === t.id && { color: '#000', fontWeight: '700' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Color Picker */}
            <Text style={styles.sectionTitle}>Card Theme Color</Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map(c => (
                <TouchableOpacity 
                  key={c}
                  style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorSelected]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Ionicons name="checkmark" size={16} color="#000" />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  cardContainer: {
    borderRadius: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
    aspectRatio: 1.586,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  simulatedChip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    opacity: 0.85,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chipLine: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardBalance: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
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
  noteText: {
    color: Colors.text.muted,
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic'
  },
  sectionTitle: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  typeRow: {
    gap: 12,
    paddingRight: 24,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  typeText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.brand.yuzu,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
  }
});

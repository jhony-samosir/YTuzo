import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState } from '../ui/EmptyState';
import { formatMoney, safeAlpha } from '../../utils/finance';
import { Wallet } from '../../types/finance';
import { Colors } from '../../constants/Colors';
import { WalletFormModal } from './WalletFormModal';
import { DEFAULT_WALLET_ID } from '../../constants/defaults';

interface ManageWalletsModalProps {
  visible: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onAddWallet: (data: Omit<Wallet, 'id' | 'currency' | 'balance'> & { balance?: number }) => void;
  onUpdateWallet: (id: string, data: Partial<Wallet>) => void;
  onDeleteWallet: (id: string, fallbackId: string) => void;
}

export const ManageWalletsModal: React.FC<ManageWalletsModalProps> = ({ 
  visible, onClose, wallets, onAddWallet, onUpdateWallet, onDeleteWallet 
}) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const handleCreateOrEdit = (data: Omit<Wallet, 'id' | 'currency' | 'balance'> & { balance?: number }) => {
    if (editingWallet) {
      onUpdateWallet(editingWallet.id, data);
    } else {
      onAddWallet(data);
    }
  };

  const openEdit = (w: Wallet) => {
    setEditingWallet(w);
    setIsFormVisible(true);
  };

  const openAdd = () => {
    setEditingWallet(null);
    setIsFormVisible(true);
  };

  const confirmDelete = (w: Wallet) => {
    if (w.id === DEFAULT_WALLET_ID) {
      import('react-native').then(({ Alert }) => {
        Alert.alert('Restricted', 'The default wallet cannot be deleted.');
      });
      return;
    }
    
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        'Delete Wallet?',
        `Are you sure you want to delete "${w.name}"? Transactions associated with it will be reassigned to the Default Wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDeleteWallet(w.id, DEFAULT_WALLET_ID) }
        ]
      );
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={localStyles.container}>
        {/* Header */}
        <View style={localStyles.header}>
          <Text style={localStyles.headerTitle}>Manage Wallets</Text>
          <TouchableOpacity onPress={onClose} style={localStyles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={localStyles.netWorthContainer}>
          <Text style={localStyles.netWorthLabel}>Total Net Worth</Text>
          <Text style={localStyles.netWorthAmount}>{formatMoney(totalBalance)}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          {wallets.length === 0 ? (
            <EmptyState 
              icon="wallet-outline" 
              title="No Accounts" 
              description="Add your first bank account or wallet to start tracking."
              actionLabel="Add Account"
            />
          ) : (
            wallets.map((w) => (
              <View key={w.id} style={[localStyles.cardContainer, { shadowColor: w.color_theme || '#000' }]}>
                <LinearGradient
                  colors={[w.color_theme || Colors.brand.yuzu, '#000000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={localStyles.cardGradient}
                >
                  {/* Top */}
                  <View style={localStyles.cardTopRow}>
                    <Text style={localStyles.cardLogoText}>{w.type}</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={localStyles.actionBtn} onPress={() => openEdit(w)}>
                        <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.7)" />
                      </TouchableOpacity>
                      {w.id !== DEFAULT_WALLET_ID && (
                        <TouchableOpacity style={localStyles.actionBtn} onPress={() => confirmDelete(w)}>
                          <Ionicons name="trash" size={16} color={Colors.brand.ruby} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Middle */}
                  <View style={localStyles.cardMiddleRow}>
                    {(w.type === 'BANK' || w.type === 'CREDIT') && (
                      <>
                        <View style={localStyles.simulatedChip}>
                          <View style={localStyles.chipLine} />
                          <View style={localStyles.chipLine} />
                        </View>
                        <Ionicons name="wifi" size={28} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
                      </>
                    )}
                    {w.type === 'E-WALLET' && <Ionicons name="qr-code-outline" size={32} color="rgba(255,255,255,0.6)" />}
                    {w.type === 'CASH' && <Ionicons name="wallet-outline" size={32} color="rgba(255,255,255,0.6)" />}
                    {w.type === 'INVEST' && <Ionicons name="trending-up-outline" size={32} color="rgba(255,255,255,0.6)" />}
                  </View>

                  {/* Bottom */}
                  <View style={localStyles.cardBottomRow}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                      <Text style={localStyles.cardLabel}>WALLET NAME</Text>
                      <Text style={localStyles.cardName} numberOfLines={1}>{w.name || 'Unnamed Wallet'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={localStyles.cardLabel}>{w.type === 'CREDIT' ? 'BILLED' : 'BALANCE'}</Text>
                      <Text style={localStyles.cardBalance}>{formatMoney(w.balance)}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={localStyles.fab} onPress={openAdd}>
          <Ionicons name="add" size={24} color="#000" />
          <Text style={localStyles.fabText}>Add Wallet</Text>
        </TouchableOpacity>
      </View>

      <WalletFormModal 
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSave={handleCreateOrEdit}
        initialData={editingWallet}
      />
    </Modal>
  );
};

const localStyles = StyleSheet.create({
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
  cardContainer: {
    borderRadius: 20,
    marginBottom: 20,
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
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  fabText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  netWorthContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  netWorthLabel: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  netWorthAmount: {
    color: Colors.text.primary,
    fontSize: 32,
    fontWeight: '800',
  }
});

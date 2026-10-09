import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, useWindowDimensions, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '../../constants/Colors';
import { TouchableScale } from '../../components/ui/TouchableScale';
import { financeStyles as styles } from '../../components/finance/financeStyles';
import { useFinanceData } from '../../hooks/useFinanceData';
import { Transaction, Subscription, Budget } from '../../types/finance';

// Subcomponents
import { OverviewTab } from '../../components/finance/OverviewTab';
import { TransactionsTab } from '../../components/finance/TransactionsTab';
import { BudgetsTab } from '../../components/finance/BudgetsTab';
import { TransactionModal } from '../../components/finance/TransactionModal';
import { ScheduledTab } from '../../components/finance/ScheduledTab';
import { ScheduleFormModal } from '../../components/finance/ScheduleFormModal';
import { BudgetModal } from '../../components/finance/BudgetModal';
import { ManageCategoriesModal } from '../../components/finance/ManageCategoriesModal';
import { ManageWalletsModal } from '../../components/finance/ManageWalletsModal';

type TabType = 'OVERVIEW' | 'TRANSACTIONS' | 'SCHEDULED' | 'BUDGETS';
const TABS: TabType[] = ['OVERVIEW', 'TRANSACTIONS', 'SCHEDULED', 'BUDGETS'];

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const submenuRef = useRef<ScrollView>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [showChart, setShowChart] = useState(false);
  
  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Subscription | null>(null);

  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [isManageCategoriesVisible, setIsManageCategoriesVisible] = useState(false);
  const [isManageWalletsVisible, setIsManageWalletsVisible] = useState(false);
  const [isSettingsMenuVisible, setIsSettingsMenuVisible] = useState(false);

  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.openModal === 'true') {
      setTimeout(() => {
        setIsModalVisible(true);
        router.setParams({ openModal: '' });
      }, 0);
    }
  }, [params.openModal]);

  const handleFabPress = () => {
    setEditingTransaction(null);
    setIsModalVisible(true);
  };

  useEffect(() => {
    if (params.action === 'fab') {
      setTimeout(() => {
        if (activeTab === 'TRANSACTIONS' || activeTab === 'OVERVIEW') {
          handleFabPress();
        } else if (activeTab === 'SCHEDULED') {
          setEditingSchedule(null);
          setIsScheduleModalVisible(true);
        } else if (activeTab === 'BUDGETS') {
          setEditingBudget(null);
          setIsBudgetModalVisible(true);
        }
        router.setParams({ action: '' });
      }, 0);
    }
  }, [params.action, activeTab]);

  const { 
    wallets, 
    categories,
    budgets, 
    subscriptions, 
    transactions, 
    totalBalance,
    deleteTransaction,
    addTransaction,
    updateTransaction,
    fetchFilteredTransactions,
    deleteSubscription,
    addSubscription,
    updateSubscription,
    addBudget,
    updateBudget,
    deleteBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addWallet,
    updateWallet,
    deleteWallet
  } = useFinanceData();



  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalVisible(true);
  };

  const handleSaveTransaction = (data: Partial<Transaction>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, data);
    } else {
      addTransaction(data as Omit<Transaction, 'id' | 'created_at'>);
    }
  };

  const handleSaveSchedule = (data: Partial<Subscription>) => {
    if (editingSchedule) {
      updateSubscription(editingSchedule.id, data);
    } else {
      addSubscription(data as Omit<Subscription, 'id'>);
    }
  };

  const handleSaveBudget = (data: { category_id: string; monthly_limit: number }) => {
    if (editingBudget) {
      updateBudget(editingBudget.id, data);
    } else {
      addBudget(data);
    }
  };

  const syncSubmenuScroll = (index: number) => {
    const scrollPosition = (index * 110) - (width / 2) + 55;
    submenuRef.current?.scrollTo({ x: Math.max(0, scrollPosition), animated: true });
  };

  const handleTabPress = (tab: TabType, index: number) => {
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    syncSubmenuScroll(index);
  };

  const renderSubmenu = () => (
    <View style={localStyles.submenuContainer}>
      <ScrollView 
        ref={submenuRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={localStyles.submenuScrollContent}
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab;
          const tabName = tab.charAt(0) + tab.slice(1).toLowerCase();
          
          return (
            <TouchableScale 
              key={tab} 
              scaleTo={0.92}
              onPress={() => handleTabPress(tab, index)} 
              style={[
                localStyles.tabItem,
                isActive && localStyles.tabItemActive
              ]}
            >
              <Text style={[
                localStyles.tabText,
                isActive && localStyles.tabTextActive
              ]}>
                {tabName}
              </Text>
            </TouchableScale>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient 
        colors={[Colors.background.secondary, Colors.background.primary]} 
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableScale style={styles.backBtn} onPress={() => router.push('/')} scaleTo={0.9}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableScale>
          <Text style={styles.headerTitle}>Finance</Text>
          <TouchableScale 
            style={[
              styles.headerActionBtn, 
              (showChart || isSettingsMenuVisible) && { backgroundColor: Colors.brand.yuzu, borderColor: Colors.brand.yuzu }
            ]} 
            onPress={() => {
              if (activeTab === 'OVERVIEW') {
                setShowChart(!showChart);
              } else {
                setIsSettingsMenuVisible(true);
              }
            }}
            scaleTo={0.9}
          >
            <Ionicons name={activeTab === 'OVERVIEW' ? "pie-chart" : "ellipsis-vertical"} size={20} color={(showChart || isSettingsMenuVisible) ? '#000' : Colors.text.primary} />
          </TouchableScale>
        </View>

        {renderSubmenu()}

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const page = Math.round(offsetX / width);
            if (TABS[page] && activeTab !== TABS[page]) {
              setActiveTab(TABS[page]);
              syncSubmenuScroll(page);
            }
          }}
        >
          {/* OVERVIEW */}
          <View style={{ width }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
              <OverviewTab 
                totalBalance={totalBalance}
                transactions={transactions}
                subscriptions={subscriptions}
                showChart={showChart}
                onSeeAllTransactions={() => handleTabPress('TRANSACTIONS', 1)}
                onManageSubscriptions={() => handleTabPress('SCHEDULED', 2)}
              />
            </ScrollView>
          </View>
          
          {/* TRANSACTIONS */}
          <View style={{ width }}>
            <TransactionsTab 
              globalTransactions={transactions} 
              fetchFilteredTransactions={fetchFilteredTransactions}
              onDeleteTransaction={deleteTransaction} 
              onEditTransaction={handleEditTransaction}
            />
          </View>

          {/* SCHEDULED */}
          <View style={{ width }}>
            <ScheduledTab 
              subscriptions={subscriptions} 
              onAdd={() => {
                setEditingSchedule(null);
                setIsScheduleModalVisible(true);
              }}
              onEdit={(sub) => {
                setEditingSchedule(sub);
                setIsScheduleModalVisible(true);
              }}
              onTogglePause={(id, isPaused) => updateSubscription(id, { is_paused: isPaused })}
            />
          </View>
          
          {/* BUDGETS */}
          <View style={{ width }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
              <BudgetsTab 
                budgets={budgets} 
                onAdd={() => {
                  setEditingBudget(null);
                  setIsBudgetModalVisible(true);
                }}
                onEdit={(budget) => {
                  setEditingBudget(budget);
                  setIsBudgetModalVisible(true);
                }}
              />
            </ScrollView>
          </View>
        </ScrollView>

        {/* CUD Modal */}
        {isModalVisible && (
          <TransactionModal 
            visible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            onSave={handleSaveTransaction}
            initialData={editingTransaction}
            categories={categories}
            wallets={wallets}
          />
        )}

        {/* Schedule Form Modal */}
        {isScheduleModalVisible && (
          <ScheduleFormModal 
            visible={isScheduleModalVisible}
            onClose={() => setIsScheduleModalVisible(false)}
            onSave={handleSaveSchedule}
            onDelete={deleteSubscription}
            initialData={editingSchedule}
            wallets={wallets}
          />
        )}

        {/* Budget Modal */}
        {isBudgetModalVisible && (
          <BudgetModal 
            visible={isBudgetModalVisible}
            onClose={() => setIsBudgetModalVisible(false)}
            onSave={handleSaveBudget}
            onDelete={deleteBudget}
            onAddCategory={addCategory}
            onManageCategories={() => setIsManageCategoriesVisible(true)}
            initialData={editingBudget}
            categories={categories}
          />
        )}

        {/* Settings Menu Modal */}
        <Modal visible={isSettingsMenuVisible} transparent animationType="fade" onRequestClose={() => setIsSettingsMenuVisible(false)}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: insets.top + 70, paddingRight: 24 }} activeOpacity={1} onPress={() => setIsSettingsMenuVisible(false)}>
            <View style={localStyles.settingsMenu}>
              <TouchableOpacity style={localStyles.settingsMenuItem} onPress={() => { setIsSettingsMenuVisible(false); setIsManageCategoriesVisible(true); }}>
                <Ionicons name="pricetag-outline" size={20} color={Colors.text.primary} />
                <Text style={localStyles.settingsMenuText}>Manage Categories</Text>
              </TouchableOpacity>
              <View style={localStyles.settingsMenuDivider} />
              <TouchableOpacity style={localStyles.settingsMenuItem} onPress={() => { setIsSettingsMenuVisible(false); setIsManageWalletsVisible(true); }}>
                <Ionicons name="wallet-outline" size={20} color={Colors.text.primary} />
                <Text style={localStyles.settingsMenuText}>Manage Wallets</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Manage Categories Modal */}
        {isManageCategoriesVisible && (
          <ManageCategoriesModal
            visible={isManageCategoriesVisible}
            onClose={() => setIsManageCategoriesVisible(false)}
            categories={categories}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        )}

        {/* Manage Wallets Modal */}
        {isManageWalletsVisible && (
          <ManageWalletsModal
            visible={isManageWalletsVisible}
            onClose={() => setIsManageWalletsVisible(false)}
            wallets={wallets}
            onAddWallet={addWallet}
            onUpdateWallet={updateWallet}
            onDeleteWallet={deleteWallet}
          />
        )}
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const localStyles = StyleSheet.create({
  settingsMenu: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 8,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  settingsMenuText: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  settingsMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },
  submenuContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  submenuScrollContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 6,
    flexDirection: 'row',
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#000000',
  }
});

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, useWindowDimensions, DeviceEventEmitter, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '../../constants/Colors';
import { TouchableScale } from '../../components/ui/TouchableScale';
import { financeStyles as styles } from '../../components/finance/financeStyles';
import { useFinanceData } from '../../hooks/useFinanceData';
import { Transaction, Subscription } from '../../types/finance';

// Subcomponents
import { OverviewTab } from '../../components/finance/OverviewTab';
import { TransactionsTab } from '../../components/finance/TransactionsTab';
import { BudgetsTab } from '../../components/finance/BudgetsTab';
import { AccountsTab } from '../../components/finance/AccountsTab';
import { TransactionModal } from '../../components/finance/TransactionModal';
import { ScheduledTab } from '../../components/finance/ScheduledTab';
import { ScheduleFormModal } from '../../components/finance/ScheduleFormModal';

type TabType = 'OVERVIEW' | 'TRANSACTIONS' | 'SCHEDULED' | 'BUDGETS' | 'ACCOUNTS';
const TABS: TabType[] = ['OVERVIEW', 'TRANSACTIONS', 'SCHEDULED', 'BUDGETS', 'ACCOUNTS'];

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

  // Context-Aware FAB Listener
  useEffect(() => {
      const subscriptionEvent = DeviceEventEmitter.addListener('financeGlobalFabPress', () => {
      if (activeTab === 'TRANSACTIONS') {
        handleFabPress(); // Opens New Transaction
      } else if (activeTab === 'SCHEDULED') {
        setEditingSchedule(null);
        setIsScheduleModalVisible(true);
      } else if (activeTab === 'BUDGETS') {
        Alert.alert('New Budget', 'Form to add a new Budget will open here!');
      } else if (activeTab === 'ACCOUNTS') {
        Alert.alert('New Wallet', 'Form to add a new Wallet will open here!');
      } else {
        // Default action for Overview
        handleFabPress();
      }
    });

    return () => subscriptionEvent.remove();
  }, [activeTab]);

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
    updateSubscription
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
    <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
      <ScrollView 
        ref={submenuRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 24,
          padding: 6,
          flexDirection: 'row',
        }}
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab;
          const tabName = tab.charAt(0) + tab.slice(1).toLowerCase();
          
          return (
            <TouchableScale 
              key={tab} 
              scaleTo={0.92}
              onPress={() => handleTabPress(tab, index)} 
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 18,
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                shadowColor: isActive ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isActive ? 0.15 : 0,
                shadowRadius: 8,
                elevation: isActive ? 4 : 0,
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: isActive ? '700' : '600',
                color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.5)',
                letterSpacing: 0.3,
              }}>
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
              showChart && { backgroundColor: Colors.brand.yuzu, borderColor: Colors.brand.yuzu }
            ]} 
            onPress={() => setShowChart(!showChart)}
            scaleTo={0.9}
          >
            <Ionicons name="pie-chart" size={20} color={showChart ? '#000' : Colors.text.primary} />
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
              onTogglePause={(id, isPaused) => updateSubscription(id, { is_paused: isPaused ? 1 : 0 })}
            />
          </View>
          
          {/* BUDGETS */}
          <View style={{ width }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
              <BudgetsTab budgets={budgets} />
            </ScrollView>
          </View>
          
          {/* ACCOUNTS */}
          <View style={{ width }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
              <AccountsTab wallets={wallets} />
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
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

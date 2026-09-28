import React, { useState } from 'react';
import { View, StyleSheet, Platform, Modal, TouchableOpacity, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableScale } from '../ui/TouchableScale';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';

export function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [actionMenuVisible, setActionMenuVisible] = useState(false);

  return (
    <>
      <View style={[styles.floatingNavContainer, { bottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
      <BlurView 
        intensity={Platform.OS === 'ios' ? 40 : 100} 
        tint="dark" 
        style={styles.floatingNavBackground}
      />
      <View style={styles.floatingNavItems}>
        {state.routes.map((route: any, index: number) => {
          // Only show Home and Settings in the Bottom Nav Bar
          if (route.name !== 'index' && route.name !== 'settings') return null;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const getIcon = () => {
            const color = isFocused ? Colors.brand.yuzu : Colors.text.muted;
            if (route.name === 'index') {
              return <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} size={24} tintColor={color} fallback={<Ionicons name="home" size={24} color={color} />} />;
            }
            if (route.name === 'settings') {
              return <SymbolView name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} size={24} tintColor={color} fallback={<Ionicons name="settings-outline" size={24} color={color} />} />;
            }
            return <Ionicons name="alert" size={24} color={color} />;
          };

          return (
            <React.Fragment key={route.key}>
              <TouchableScale style={styles.navItem} onPress={onPress}>
                <View style={styles.iconWrapper}>
                  {getIcon()}
                </View>
                {isFocused && <View style={styles.navIndicator} />}
              </TouchableScale>
              
              {/* Insert the FAB perfectly in the middle (after the Home tab) */}
              {route.name === 'index' && (
                 <View style={styles.navFabPlaceholder}>
                   <TouchableScale 
                     style={styles.navFab} 
                     scaleTo={0.9}
                     onPress={() => {
                       const focusedRouteName = state.routes[state.index].name;
                       if (focusedRouteName === 'finance') {
                         // Let the Finance screen handle it contextually
                         router.setParams({ action: 'fab' });
                       } else {
                         // Homepage or other tabs -> Show Global Quick Actions
                         setActionMenuVisible(true);
                       }
                     }}
                   >
                     <LinearGradient
                       colors={[Colors.brand.yuzu, Colors.brand.blaze]}
                       style={styles.navFabGradient}
                     >
                       <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={32} tintColor="#FFFFFF" fallback={<Ionicons name="add" size={32} color="#FFFFFF" />} />
                     </LinearGradient>
                   </TouchableScale>
                 </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
      </View>

      {/* Global Action Menu Modal */}
      {actionMenuVisible && (
        <Modal visible={actionMenuVisible} transparent animationType="fade" onRequestClose={() => setActionMenuVisible(false)}>
          <View style={styles.actionMenuOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActionMenuVisible(false)}>
              <BlurView intensity={Platform.OS === 'ios' ? 20 : 80} tint="dark" style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            
            <View style={styles.actionMenuSheet}>
              <View style={styles.actionMenuHeader}>
                <Text style={styles.actionMenuTitle}>Create New</Text>
                <TouchableOpacity onPress={() => setActionMenuVisible(false)} style={styles.actionMenuClose}>
                  <Ionicons name="close" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.actionMenuGrid}>
                {/* Finance Action */}
                <TouchableScale 
                  style={styles.actionMenuBtn}
                  onPress={() => {
                    setActionMenuVisible(false);
                    router.push('/finance?openModal=true');
                  }}
                >
                  <View style={[styles.actionMenuIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Ionicons name="wallet" size={32} color={Colors.brand.mint} />
                  </View>
                  <Text style={styles.actionMenuLabel}>Transaction</Text>
                </TouchableScale>
                
                {/* Vehicle Action */}
                <TouchableScale 
                  style={styles.actionMenuBtn}
                  onPress={() => {
                    setActionMenuVisible(false);
                    router.push('/vehicle');
                  }}
                >
                  <View style={[styles.actionMenuIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Ionicons name="car" size={32} color="#3B82F6" />
                  </View>
                  <Text style={styles.actionMenuLabel}>Vehicle Log</Text>
                </TouchableScale>
                
                {/* Sports Action */}
                <TouchableScale 
                  style={styles.actionMenuBtn}
                  onPress={() => {
                    setActionMenuVisible(false);
                    router.push('/sports');
                  }}
                >
                  <View style={[styles.actionMenuIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                    <Ionicons name="football" size={32} color={Colors.brand.ruby} />
                  </View>
                  <Text style={styles.actionMenuLabel}>Sports Match</Text>
                </TouchableScale>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  floatingNavContainer: {
    position: 'absolute',
    left: 32, // Narrower for an "Island" look
    right: 32,
    height: 68, // Sleeker height
    zIndex: 10,
  },
  floatingNavBackground: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(18, 18, 20, 0.85)', // Deep dark transparent
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)', // Subtle glass edge
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
    elevation: 24,
  },
  floatingNavItems: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  navItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIndicator: {
    position: 'absolute',
    bottom: 12,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brand.yuzu,
    shadowColor: Colors.brand.yuzu,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  navFabPlaceholder: {
    flex: 1.2,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navFab: {
    top: -20, // Sit slightly higher for a "dock" feel
    shadowColor: Colors.brand.yuzu,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  navFabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Glossy inner ring
  },
  
  // Action Menu Styles
  actionMenuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionMenuSheet: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  actionMenuTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  actionMenuClose: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  actionMenuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  actionMenuBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionMenuIconBg: {
    width: 64,
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionMenuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  }
});

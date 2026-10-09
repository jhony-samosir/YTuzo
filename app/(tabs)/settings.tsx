import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Animated, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSQLiteContext } from 'expo-sqlite';

import { Colors } from '../../constants/Colors';
import { TouchableScale } from '../../components/ui/TouchableScale';
import { useSyncEngine } from '../../hooks/useSyncEngine';

// Custom Neon Switch Component built just for YTuzo
function NeonSwitch({ value, onValueChange }: { value: boolean, onValueChange: (v: boolean) => void }) {
  const [anim] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      speed: 20,
    }).start();
  }, [value, anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.background.card, Colors.brand.blaze]
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 24]
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View style={[switchStyles.track, { backgroundColor }]}>
        <Animated.View style={[switchStyles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const switchStyles = StyleSheet.create({
  track: {
    width: 52,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.faint,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.text.primary,
    shadowColor: Colors.brand.yuzu,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  }
});

// Setting Item Component
function SettingItem({ icon, title, value, type = 'link', onPress, onToggle }: any) {
  return (
    <TouchableScale onPress={type === 'link' ? onPress : undefined} scaleTo={0.98}>
      <View style={styles.settingItem}>
        <View style={styles.settingItemLeft}>
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={20} color={Colors.brand.yuzu} />
          </View>
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        
        {type === 'link' && (
          <View style={styles.settingItemRight}>
            {value && <Text style={styles.settingValue}>{value}</Text>}
            <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
          </View>
        )}
        
        {type === 'toggle' && (
          <NeonSwitch value={value} onValueChange={onToggle} />
        )}
      </View>
    </TouchableScale>
  );
}

// Group Component with Asymmetrical styling
function SettingGroup({ title, children }: any) {
  return (
    <View style={styles.groupContainer}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { pushToCloud, pullFromCloud, isSyncing } = useSyncEngine();
  
  // States
  const [profile, setProfile] = useState<any>(null);
  const [faceId, setFaceId] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const user = await db.getFirstAsync('SELECT * FROM user_profile LIMIT 1');
      setProfile(user);
      
      const prefs = await db.getFirstAsync<any>('SELECT * FROM app_preferences LIMIT 1');
      if (prefs) {
        setFaceId(Boolean(prefs.is_biometric_enabled));
        setPushNotif(Boolean(prefs.is_push_notif_enabled));
        setDarkTheme(Boolean(prefs.is_dark_theme));
      }
    }
    loadSettings();
  }, [db]);

  const togglePref = async (column: string, value: boolean, setter: any) => {
    setter(value);
    await db.runAsync(`UPDATE app_preferences SET ${column} = ?`, [value ? 1 : 0]);
  };

  return (
    <View style={styles.container}>
      {/* Subtle Background Glow */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.backgroundBase} />
        <View style={[styles.glow, { top: '-5%', right: '-20%', backgroundColor: 'rgba(249, 115, 22, 0.1)' }]} />
        <View style={[styles.glow, { bottom: '20%', left: '-20%', backgroundColor: 'rgba(250, 204, 21, 0.1)' }]} />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Command Center</Text>
          <Text style={styles.headerSubtitle}>System Preferences</Text>
        </View>

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* DIGITAL ID CARD (Mini Profile) */}
          <View style={styles.digitalIdCard}>
            <LinearGradient
              colors={[Colors.border.lighter, Colors.border.faint]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.idCardHeader}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[Colors.brand.yuzu, Colors.brand.blaze]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>JS</Text>
                </LinearGradient>
              </View>
              <View style={styles.idCardInfo}>
                <Text style={styles.idName}>{profile ? `${profile.first_name} ${profile.last_name}` : 'Loading...'}</Text>
                <Text style={styles.idRole}>Level: {profile ? profile.reputation_level : '-'}</Text>
              </View>
              <Ionicons name="qr-code-outline" size={32} color={Colors.brand.yuzu} style={{ opacity: 0.5 }} />
            </View>
            <View style={styles.idCardFooter}>
              <Text style={styles.idFooterText}>ID: YT-8492-X</Text>
              <Text style={styles.idFooterText}>Verified</Text>
            </View>
          </View>

          {/* Settings Groups */}
          <SettingGroup title="Security">
            <SettingItem icon="shield-checkmark" title="Face ID / Biometrics" type="toggle" value={faceId} onToggle={(v: boolean) => togglePref('is_biometric_enabled', v, setFaceId)} />
            <SettingItem icon="key" title="Change Passcode" />
            <SettingItem icon="lock-closed" title="Two-Factor Authentication" value="Enabled" />
          </SettingGroup>

          <SettingGroup title="Cloud & Sync">
            <SettingItem 
              icon={isSyncing ? "sync" : "cloud-upload"} 
              title="Sync to Cloud (Push)" 
              value={isSyncing ? "Pushing..." : "Push Now"} 
              onPress={pushToCloud} 
            />
            <SettingItem 
              icon={isSyncing ? "sync" : "cloud-download"} 
              title="Sync from Cloud (Pull)" 
              value={isSyncing ? "Pulling..." : "Pull Now"} 
              onPress={pullFromCloud} 
            />
          </SettingGroup>

          <SettingGroup title="Preferences">
            <SettingItem icon="moon" title="Dark Cyber Theme" type="toggle" value={darkTheme} onToggle={(v: boolean) => togglePref('is_dark_theme', v, setDarkTheme)} />
            <SettingItem icon="notifications-circle" title="Push Notifications" type="toggle" value={pushNotif} onToggle={(v: boolean) => togglePref('is_push_notif_enabled', v, setPushNotif)} />
            <SettingItem icon="language" title="Language" value="English" />
          </SettingGroup>

          <SettingGroup title="Support & About">
            <SettingItem icon="help-buoy" title="Help Center" />
            <SettingItem icon="document-text" title="Terms of Service" />
            <SettingItem icon="information-circle" title="App Version" value="v1.0.0 (Neon)" />
          </SettingGroup>

          <TouchableScale style={styles.logoutBtn}>
            <Text style={styles.logoutText}>TERMINATE SESSION</Text>
            <Ionicons name="log-out-outline" size={20} color={Colors.brand.ruby} />
          </TouchableScale>
          
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  backgroundBase: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.background.primary,
  },
  glow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.6,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: Colors.brand.yuzu,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  digitalIdCard: {
    // The YTuzo Asymmetrical Shape
    borderTopLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderTopColor: Colors.border.brand,
    borderLeftColor: Colors.border.brand,
    borderRightColor: Colors.border.faint,
    borderBottomColor: Colors.border.faint,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 40,
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
    padding: 2,
    backgroundColor: Colors.border.light,
    borderRadius: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  idCardInfo: {
    flex: 1,
  },
  idName: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  idRole: {
    color: Colors.brand.yuzu,
    fontSize: 13,
    fontWeight: '600',
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border.lighter,
    paddingTop: 12,
  },
  idFooterText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  groupContainer: {
    marginBottom: 32,
  },
  groupTitle: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
  },
  groupCard: {
    backgroundColor: Colors.background.card,
    // Slightly asymmetrical groups
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.faint,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTitle: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    color: Colors.text.muted,
    fontSize: 14,
    marginRight: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 10,
    marginBottom: 40,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  logoutText: {
    color: Colors.brand.ruby,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginRight: 8,
  },
});

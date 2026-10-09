import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, useWindowDimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useVocab, VocabItem } from '../../../hooks/useVocab';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { ManageVocabModal } from '../../../components/english/ManageVocabModal';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const FILTERS = ['ALL', 'VERB', 'NOUN', 'ADJECTIVE'];

const VocabCard = React.memo(({ 
  item, 
  isExpanded, 
  onPress,
  onLongPress,
  onOptionsPress
}: { 
  item: VocabItem; 
  isExpanded: boolean; 
  onPress: (item: VocabItem) => void;
  onLongPress: (item: VocabItem) => void;
  onOptionsPress: (item: VocabItem) => void;
}) => {
  const isRead = item.is_read === 1;

  return (
    <TouchableOpacity 
      style={[styles.card, isRead && styles.cardRead]} 
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.wordContainer}>
          <Text style={[styles.baseWord, isRead && styles.textRead]}>
            {item.base_word}
          </Text>
          <View style={[styles.badge, { backgroundColor: item.word_type === 'VERB' ? Colors.brand.ruby : '#38BDF8' }]}>
            <Text style={styles.badgeText}>{item.word_type}</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <Ionicons 
            name={isRead ? "checkmark-circle" : "ellipse-outline"} 
            size={24} 
            color={isRead ? Colors.brand.mint : Colors.text.muted} 
          />
          <TouchableOpacity style={styles.optionsBtn} onPress={() => onOptionsPress(item)}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.translation, isRead && styles.textRead]}>
        {item.translation}
      </Text>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {item.word_type === 'VERB' && (
            <View style={styles.verbForms}>
              <View style={styles.verbForm}>
                <Text style={styles.formLabel}>V2 (Past)</Text>
                <Text style={styles.formValue}>{item.v2 || '-'}</Text>
              </View>
              <View style={styles.verbForm}>
                <Text style={styles.formLabel}>V3 (Perfect)</Text>
                <Text style={styles.formValue}>{item.v3 || '-'}</Text>
              </View>
              <View style={styles.verbForm}>
                <Text style={styles.formLabel}>V-ing</Text>
                <Text style={styles.formValue}>{item.v_ing || '-'}</Text>
              </View>
            </View>
          )}

          {item.example_sentence && (
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>Example:</Text>
              <Text style={styles.exampleText}>&quot;{item.example_sentence}&quot;</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});
VocabCard.displayName = 'VocabCard';

export default function EnglishDictionaryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { vocabs, searchQuery, setSearchQuery, isLoading, error, fetchVocabs, markAsRead, addVocab, updateVocab, deleteVocab } = useVocab();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const scrollViewRef = useRef<ScrollView>(null);
  const filterScrollRef = useRef<ScrollView>(null);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVocab, setEditingVocab] = useState<VocabItem | null>(null);
  
  // Custom Action Sheet State
  const [actionSheetVocab, setActionSheetVocab] = useState<VocabItem | null>(null);
  const [deleteConfirmVocab, setDeleteConfirmVocab] = useState<VocabItem | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    // We always fetch ALL and filter locally for smooth swiping
    fetchVocabs(debouncedSearch, 'ALL');
  }, [debouncedSearch, fetchVocabs]);

  const handleCardPress = useCallback((item: VocabItem) => {
    if (expandedId === item.id) {
      setExpandedId(null);
    } else {
      setExpandedId(item.id);
      if (item.is_read === 0) {
        markAsRead(item.id);
      }
    }
  }, [expandedId, markAsRead]);

  const handleOptionsPress = useCallback((item: VocabItem) => {
    setActionSheetVocab(item);
  }, []);

  const handleFormSubmit = async (data: Omit<VocabItem, 'id' | 'is_favorite' | 'is_read' | 'last_read_at'>) => {
    if (editingVocab) {
      await updateVocab(editingVocab.id, data);
    } else {
      await addVocab(data);
    }
  };

  const renderVocabCard = useCallback(({ item }: { item: VocabItem }) => {
    return (
      <VocabCard 
        item={item}
        isExpanded={expandedId === item.id}
        onPress={handleCardPress}
        onLongPress={handleOptionsPress}
        onOptionsPress={handleOptionsPress}
      />
    );
  }, [expandedId, handleCardPress, handleOptionsPress]);

  const handleFilterPress = (filter: string, index: number) => {
    setActiveFilter(filter);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    // Center the filter chip if possible
    filterScrollRef.current?.scrollTo({ x: Math.max(0, (index * 80) - (width / 2) + 40), animated: true });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Kamus Pintar</Text>
            <Text style={styles.subtitle}>{vocabs.length} kata ditemukan</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => {
            setEditingVocab(null);
            setIsModalVisible(true);
          }}
        >
          <Ionicons name="add" size={28} color={Colors.brand.yuzu} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari kata inggris atau artinya..."
          placeholderTextColor={Colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          ref={filterScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
        >
          {FILTERS.map((filter, index) => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => handleFilterPress(filter, index)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const page = Math.round(offsetX / width);
          if (FILTERS[page] && activeFilter !== FILTERS[page]) {
            setActiveFilter(FILTERS[page]);
            filterScrollRef.current?.scrollTo({ x: Math.max(0, (page * 80) - (width / 2) + 40), animated: true });
          }
        }}
        style={{ flex: 1 }}
      >
        {FILTERS.map((filter) => {
          const filteredVocabs = filter === 'ALL' ? vocabs : vocabs.filter(v => v.word_type === filter);
          
          return (
            <View key={filter} style={{ width }}>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : isLoading ? (
                <ActivityIndicator size="large" color="#38BDF8" style={styles.loader} />
              ) : (
                <FlatList
                  data={filteredVocabs}
                  keyExtractor={(item) => item.id}
                  renderItem={renderVocabCard}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>Tidak ada kata {filter !== 'ALL' ? filter : ''} yang cocok.</Text>
                  }
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Main CRUD Modal */}
      <ManageVocabModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleFormSubmit}
        initialData={editingVocab}
      />

      {/* Custom Action Sheet */}
      <Modal
        visible={!!actionSheetVocab}
        transparent
        animationType="fade"
        onRequestClose={() => setActionSheetVocab(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setActionSheetVocab(null)}
        >
          <View style={styles.actionSheetContainer}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>{actionSheetVocab?.base_word}</Text>
              <Text style={styles.actionSheetSubtitle}>{actionSheetVocab?.translation}</Text>
            </View>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                const vocab = actionSheetVocab;
                setActionSheetVocab(null);
                setTimeout(() => {
                  setEditingVocab(vocab);
                  setIsModalVisible(true);
                }, 300);
              }}
            >
              <Ionicons name="create-outline" size={24} color={Colors.text.primary} />
              <Text style={styles.actionButtonText}>Edit Word</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonDestructive]}
              onPress={() => {
                const vocab = actionSheetVocab;
                setActionSheetVocab(null);
                setTimeout(() => setDeleteConfirmVocab(vocab), 300);
              }}
            >
              <Ionicons name="trash-outline" size={24} color={Colors.brand.ruby} />
              <Text style={[styles.actionButtonText, { color: Colors.brand.ruby }]}>Delete Word</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Delete Confirmation */}
      <Modal
        visible={!!deleteConfirmVocab}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVocab(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setDeleteConfirmVocab(null)}
        >
          <View style={styles.dialogContainer}>
            <View style={styles.dialogIconBg}>
              <Ionicons name="alert" size={32} color={Colors.brand.ruby} />
            </View>
            <Text style={styles.dialogTitle}>Delete Word?</Text>
            <Text style={styles.dialogMessage}>
              Are you sure you want to delete <Text style={{ fontWeight: 'bold', color: Colors.text.primary }}>{deleteConfirmVocab?.base_word}</Text>? This action cannot be undone.
            </Text>
            
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setDeleteConfirmVocab(null)}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dialogDeleteBtn} 
                onPress={() => {
                  if (deleteConfirmVocab) {
                    deleteVocab(deleteConfirmVocab.id);
                    setDeleteConfirmVocab(null);
                  }
                }}
              >
                <Text style={styles.dialogDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16, padding: 8, backgroundColor: Colors.border.faint, borderRadius: 12 },
  addBtn: { padding: 8, backgroundColor: 'rgba(250, 204, 21, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: Colors.border.brand },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text.primary },
  subtitle: { fontSize: 14, color: Colors.text.secondary, marginTop: 4 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.secondary, marginHorizontal: 20,
    borderRadius: 12, paddingHorizontal: 12, height: 48,
    marginBottom: 16
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text.primary, fontSize: 16 },
  filterContainer: {
    flexDirection: 'row', marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border.light
  },
  filterChipActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  filterText: { color: Colors.text.secondary, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: Colors.background.primary },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.background.secondary, borderRadius: 16,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border.light
  },
  cardRead: { backgroundColor: Colors.background.primary, borderColor: Colors.background.secondary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  optionsBtn: { padding: 8, marginLeft: 4, marginRight: -8 }, // Increased hit area
  wordContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  baseWord: { fontSize: 20, fontWeight: 'bold', color: Colors.text.primary },
  textRead: { color: Colors.text.secondary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: Colors.text.primary },
  translation: { fontSize: 16, color: '#38BDF8', marginTop: 4 },
  expandedContent: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: Colors.border.light
  },
  verbForms: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  verbForm: { flex: 1, alignItems: 'center', backgroundColor: Colors.background.primary, padding: 8, borderRadius: 8, marginHorizontal: 4 },
  formLabel: { fontSize: 12, color: Colors.text.secondary, marginBottom: 4 },
  formValue: { fontSize: 14, color: Colors.text.primary, fontWeight: '500' },
  exampleContainer: { backgroundColor: Colors.background.primary, padding: 12, borderRadius: 8 },
  exampleLabel: { fontSize: 12, color: Colors.text.secondary, marginBottom: 4 },
  exampleText: { fontSize: 14, color: Colors.text.primary, fontStyle: 'italic' },
  loader: { flex: 1, justifyContent: 'center' },
  emptyText: { color: Colors.text.secondary, textAlign: 'center', marginTop: 40 },
  errorText: { color: Colors.brand.ruby, textAlign: 'center', marginTop: 40, fontWeight: 'bold' },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40, // Extra padding for safe area bottom
  },
  actionSheetHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingBottom: 16,
    marginBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  actionSheetSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  actionButtonDestructive: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 12,
  },
  dialogContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 24,
    padding: 24,
    margin: 24,
    alignItems: 'center',
    alignSelf: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: '50%', // Center vertically
  },
  dialogIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  dialogMessage: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
  },
  dialogCancelText: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  dialogDeleteBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.brand.ruby,
    alignItems: 'center',
  },
  dialogDeleteText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  }
});

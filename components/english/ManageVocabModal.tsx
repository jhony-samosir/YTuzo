import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { WordType, VocabItem } from '../../hooks/useVocab';
import { LinearGradient } from 'expo-linear-gradient';

interface ManageVocabModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<VocabItem, 'id' | 'is_favorite' | 'is_read' | 'last_read_at'>) => void;
  initialData?: VocabItem | null;
}

const WORD_TYPES: { id: WordType, icon: string }[] = [
  { id: 'NOUN', icon: 'cube' },
  { id: 'VERB', icon: 'flash' },
  { id: 'ADJECTIVE', icon: 'color-palette' },
  { id: 'ADVERB', icon: 'timer' },
  { id: 'PHRASE', icon: 'chatbubbles' }
];

export const ManageVocabModal: React.FC<ManageVocabModalProps> = ({ 
  visible, onClose, onSubmit, initialData 
}) => {
  const [baseWord, setBaseWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [wordType, setWordType] = useState<WordType>('NOUN');
  const [v2, setV2] = useState('');
  const [v3, setV3] = useState('');
  const [ving, setVing] = useState('');
  const [example, setExample] = useState('');

  /* eslint-disable */
  useEffect(() => {
    if (visible && initialData) {
      setBaseWord(initialData.base_word);
      setTranslation(initialData.translation);
      setWordType(initialData.word_type);
      setV2(initialData.v2 || '');
      setV3(initialData.v3 || '');
      setVing(initialData.v_ing || '');
      setExample(initialData.example_sentence || '');
    } else if (visible && !initialData) {
      setBaseWord('');
      setTranslation('');
      setWordType('NOUN');
      setV2('');
      setV3('');
      setVing('');
      setExample('');
    }
  }, [visible, initialData]);
  /* eslint-enable */

  const handleSave = () => {
    if (!baseWord.trim() || !translation.trim()) return;

    onSubmit({
      base_word: baseWord.trim(),
      translation: translation.trim(),
      word_type: wordType,
      v2: wordType === 'VERB' ? v2.trim() : undefined,
      v3: wordType === 'VERB' ? v3.trim() : undefined,
      v_ing: wordType === 'VERB' ? ving.trim() : undefined,
      example_sentence: example.trim()
    });
    
    onClose();
  };

  const getTypeColor = (type: WordType) => type === 'VERB' ? Colors.brand.ruby : '#38BDF8';

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{initialData ? 'Edit Word' : 'New Word'}</Text>

          {/* Live Preview Card */}
          <View style={[styles.previewCardContainer, { shadowColor: getTypeColor(wordType) }]}>
            <LinearGradient
              colors={[getTypeColor(wordType), '#000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewCardGradient}
            >
              <View style={styles.previewCardHeader}>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>{wordType}</Text>
                </View>
                <Ionicons name="bookmark-outline" size={20} color="rgba(255,255,255,0.6)" />
              </View>

              <View style={styles.previewCardBody}>
                <Text style={styles.previewBaseWord} numberOfLines={1}>
                  {baseWord || 'Word'}
                </Text>
                <Text style={styles.previewTranslation} numberOfLines={1}>
                  {translation || 'Arti kata'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Base Word & Translation */}
            <TextInput
              style={styles.input}
              placeholder="Base Word (e.g. ubiquitous)"
              placeholderTextColor={Colors.text.muted}
              value={baseWord}
              onChangeText={setBaseWord}
            />

            <TextInput
              style={[styles.input, { marginTop: 16 }]}
              placeholder="Translation (e.g. ada di mana-mana)"
              placeholderTextColor={Colors.text.muted}
              value={translation}
              onChangeText={setTranslation}
            />

            {/* Type Picker */}
            <Text style={styles.sectionTitle}>Word Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
              {WORD_TYPES.map(t => (
                <TouchableOpacity 
                  key={t.id}
                  style={[styles.typeBtn, wordType === t.id && { backgroundColor: Colors.brand.yuzu, borderColor: Colors.brand.yuzu }]}
                  onPress={() => setWordType(t.id)}
                >
                  <Ionicons name={t.icon as any} size={18} color={wordType === t.id ? '#000' : Colors.text.muted} />
                  <Text style={[styles.typeText, wordType === t.id && { color: '#000', fontWeight: '700' }]}>{t.id}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Verb Forms */}
            {wordType === 'VERB' && (
              <>
                <Text style={styles.sectionTitle}>Verb Forms (Opsional)</Text>
                <View style={styles.verbGrid}>
                  <TextInput
                    style={[styles.input, styles.verbInput]}
                    placeholder="V2 (Past)"
                    placeholderTextColor={Colors.text.muted}
                    value={v2}
                    onChangeText={setV2}
                  />
                  <TextInput
                    style={[styles.input, styles.verbInput]}
                    placeholder="V3 (Perfect)"
                    placeholderTextColor={Colors.text.muted}
                    value={v3}
                    onChangeText={setV3}
                  />
                  <TextInput
                    style={[styles.input, styles.verbInput]}
                    placeholder="V-ing"
                    placeholderTextColor={Colors.text.muted}
                    value={ving}
                    onChangeText={setVing}
                  />
                </View>
              </>
            )}

            {/* Example Sentence */}
            <Text style={styles.sectionTitle}>Example Sentence</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write an example using the word..."
              placeholderTextColor={Colors.text.muted}
              multiline
              numberOfLines={3}
              value={example}
              onChangeText={setExample}
            />
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveBtn, (!baseWord.trim() || !translation.trim()) && styles.saveBtnDisabled]} 
              onPress={handleSave}
              disabled={!baseWord.trim() || !translation.trim()}
            >
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
  
  // Live Preview Styling (Matching Finance)
  previewCardContainer: {
    borderRadius: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  previewCardGradient: {
    borderRadius: 20,
    padding: 20,
    aspectRatio: 2.2, // wider than finance since it's a word
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  previewCardBody: {
    marginTop: 8,
  },
  previewBaseWord: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewTranslation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },

  scrollContent: {
    paddingBottom: 20,
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
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  typeText: {
    color: Colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  verbGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  verbInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
  },
  
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
  }
});

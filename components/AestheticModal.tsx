import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinancial } from '@/context/FinancialContext';

interface AestheticModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}

export const AestheticModal: React.FC<AestheticModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  children,
}) => {
  const { colors } = useFinancial();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.backdrop}>
          {/* Backdrop touch target to dismiss modal on tap outside */}
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdropDismissArea} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.borderSoft,
                ...colors.cardShadow,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.titleColumn}>
                <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                  {title} {icon ? icon : ''}
                </Text>
                {subtitle ? (
                  <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
              >
                <Ionicons name="close" size={20} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.scrollContent}
              style={styles.scrollView}
              bounces={false}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropDismissArea: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
  },
  scrollView: {
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  titleColumn: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 28,
  },
});

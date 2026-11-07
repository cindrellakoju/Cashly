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
  ImageBackground,
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
        keyboardVerticalOffset={0}
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
            <ImageBackground
              source={require('@/assets/images/grid_paper.png')}
              resizeMode="repeat"
              style={styles.gridOverlay}
              imageStyle={{ opacity: 0.55 }}
            >
              {/* Header */}
              <View style={[styles.headerRow, { borderBottomColor: colors.borderSoft }]}>
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
                  style={[styles.closeBtn, { backgroundColor: colors.bgCardAlt, borderColor: colors.borderSoft }]}
                >
                  <Ionicons name="close" size={17} color={colors.textMain} />
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
            </ImageBackground>
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
    backgroundColor: 'rgba(44, 34, 29, 0.55)',
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
    borderWidth: 0,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  gridOverlay: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
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
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

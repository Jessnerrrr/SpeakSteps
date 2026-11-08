import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SignOutConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SignOutConfirmModal({
  visible,
  onClose,
  onConfirm,
}: SignOutConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon Badge */}
          <View style={styles.iconBadge}>
            <Ionicons name="log-out-outline" size={28} color="#E74C3C" />
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>Sign out</Text>
          <Text style={styles.message}>Are you sure you want to sign out?</Text>

          {/* Action Buttons Row */}
          <View style={styles.buttonRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.signOutButton}
              activeOpacity={0.85}
              onPress={onConfirm}
            >
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#C7DFEE',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDECEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#0D68AC',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#6B8299',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E7F2FA',
    borderWidth: 1.5,
    borderColor: '#CBE0EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#0D68AC',
  },
  signOutButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});

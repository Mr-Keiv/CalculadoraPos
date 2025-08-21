import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface TransactionResultModalProps {
  visible: boolean;
  isSuccess: boolean;
  onClose: () => void;
  successMessage?: string;
  errorMessage?: string;
}

const TransactionResultModal: React.FC<TransactionResultModalProps> = ({
  visible,
  isSuccess,
  onClose,
  successMessage = "¡Transacción Exitosa!",
  errorMessage = "Transacción Fallida"
}) => {

  useEffect(() => {
    if (visible) {
      // Auto-close modal after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.content}>
            {/* Lottie Animation */}
            <LottieView
              source={
                isSuccess
                  ? require('../../assets/animacion/succees.json') // Necesitas agregar este archivo
                  : require('../../assets/animacion/error.json')   // Necesitas agregar este archivo
              }
              autoPlay
              loop={false}
              style={styles.lottie}
              speed={1.2}
            />
            
            {/* Message */}
            <Text style={[
              styles.message,
              { color: isSuccess ? '#4CAF50' : '#F44336' }
            ]}>
              {isSuccess ? successMessage : errorMessage}
            </Text>
            
            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={[
                styles.progressBar,
                { backgroundColor: isSuccess ? '#4CAF50' : '#F44336' }
              ]} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  lottie: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    borderRadius: 2,
    // Animation will be handled by CSS if needed
  },
});

export default TransactionResultModal;
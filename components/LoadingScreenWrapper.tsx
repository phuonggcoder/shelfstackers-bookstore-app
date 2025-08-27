import React from 'react';
import { Modal, View } from 'react-native';
import LoadingScreen from '../screens/LoadingScreen';

interface LoadingScreenWrapperProps {
  visible: boolean;
  onRequestClose?: () => void;
}

const LoadingScreenWrapper: React.FC<LoadingScreenWrapperProps> = ({
  visible,
  onRequestClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1 }}>
        <LoadingScreen />
      </View>
    </Modal>
  );
};

export default LoadingScreenWrapper;


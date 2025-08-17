import { useEffect, useRef } from 'react';
import { Keyboard, ScrollView, TextInput, findNodeHandle } from 'react-native';

/**
 * A custom hook to ensure the focused input field scrolls into view above the keyboard,
 * and recenters when the keyboard is interacted with after scrolling away.
 *
 * @param scrollViewRef - A reference to the ScrollView containing the input fields.
 * @param offset - Additional offset to position the input field above the keyboard.
 * @returns A ref to attach to the input field.
 */
const useKeyboardAwareScroll = (
  scrollViewRef: React.RefObject<ScrollView>,
  offset: number = 30
) => {
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (inputRef.current && scrollViewRef.current) {
        const scrollViewNodeHandle = findNodeHandle(scrollViewRef.current);
        if (scrollViewNodeHandle) {
          inputRef.current.measureLayout(
            scrollViewNodeHandle,
            (x, y, width, height) => {
              const targetY = y - offset - height / 2; // Center the input field above the keyboard
              scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
            },
            () => {}
          );
        }
      }
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (scrollViewRef.current) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [scrollViewRef, offset]);

  return inputRef;
};

export default useKeyboardAwareScroll;

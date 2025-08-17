import { useEffect, useRef } from 'react';
import { Keyboard, ScrollView, TextInput, findNodeHandle } from 'react-native';

/**
 * A custom hook to automatically scroll a focused input field into view above the keyboard.
 *
 * @param scrollViewRef - A reference to the ScrollView containing the input fields.
 * @returns A ref to attach to the input field.
 */
const useAutoScrollOnFocus = (scrollViewRef: React.RefObject<ScrollView>) => {
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (inputRef.current && scrollViewRef.current) {
        const scrollViewNodeHandle = findNodeHandle(scrollViewRef.current);
        if (scrollViewNodeHandle) {
          inputRef.current.measureLayout(
            scrollViewNodeHandle,
            (x, y) => {
              scrollViewRef.current?.scrollTo({ y, animated: true });
            },
            () => {}
          );
        }
      }
    });

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [scrollViewRef]);

  return inputRef;
};

export default useAutoScrollOnFocus;

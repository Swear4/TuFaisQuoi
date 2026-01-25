import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

interface SwipeableScreenProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enabled?: boolean;
}

export default function SwipeableScreen({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  enabled = true 
}: SwipeableScreenProps) {
  const swipeGesture = Gesture.Pan()
    .enabled(enabled)
    .onEnd((event) => {
      const SWIPE_THRESHOLD = 50;
      const SWIPE_VELOCITY_THRESHOLD = 500;
      
      if (
        Math.abs(event.velocityX) > SWIPE_VELOCITY_THRESHOLD ||
        Math.abs(event.translationX) > SWIPE_THRESHOLD
      ) {
        if (event.translationX > 0 && onSwipeRight) {
          // Swipe right
          onSwipeRight();
        } else if (event.translationX < 0 && onSwipeLeft) {
          // Swipe left
          onSwipeLeft();
        }
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

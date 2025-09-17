import React from "react";
import { ActivityIndicator, Animated, View } from "react-native";

interface LoaderProps {
  visible: boolean;
}

const Loader: React.FC<LoaderProps> = ({ visible }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className="absolute inset-0 bg-black/60 items-center justify-center z-50"
    >
      <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    </Animated.View>
  );
};

export default Loader;

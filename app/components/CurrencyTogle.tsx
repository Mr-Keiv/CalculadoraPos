import { useRef, useEffect, useState } from "react";
import { Animated, View, TouchableOpacity, Text, StyleSheet, LayoutChangeEvent } from "react-native";

interface CurrencyToggleProps {
  value: boolean; // false = izquierda (USD), true = derecha (EUR)
  onValueChange: (value: boolean) => void;
  leftLabel: { text: string; rate: string };
  rightLabel: { text: string; rate: string };
}

export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  value,
  onValueChange,
  leftLabel,
  rightLabel,
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      stiffness: 200,
      damping: 15,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [value]);

  // Capturar el ancho real del track
  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  // Movimiento dinámico según el ancho real
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, trackWidth / 2], // siempre la mitad del ancho
  });

  const scaleAnim = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  });

  const shadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  const leftColor = value ? "#cccccc" : "#ffffff";
  const rightColor = value ? "#ffffff" : "#cccccc";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.track}
        onLayout={handleLayout}
        onPress={() => onValueChange(!value)}
      >
        {/* Labels */}
        <View style={styles.inactiveContainer}>
          <Text style={[styles.inactiveText, { color: leftColor }]}>{leftLabel.text}</Text>
          <Text style={[styles.inactiveText, { color: rightColor }]}>{rightLabel.text}</Text>
        </View>

        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              width: trackWidth / 2,
              transform: [{ translateX }, { scale: scaleAnim }],
              shadowOpacity,
            },
          ]}
        >
          <Text style={styles.activeText}>
            {value
              ? `${rightLabel.text} ${rightLabel.rate}`
              : `${leftLabel.text} ${leftLabel.rate}`}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "85%", // se adapta a cualquier pantalla
    alignSelf: "center",
    marginVertical: 10,
  },
  track: {
    width: "100%",
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0f065a",
    justifyContent: "center",
    padding: 2,
    overflow: "hidden",
  },
  thumb: {
    position: "absolute",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#4a21ef",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4a21ef",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  activeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  inactiveContainer: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  inactiveText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

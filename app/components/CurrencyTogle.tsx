import { useRef, useEffect } from "react";
import { Animated, View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

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

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      stiffness: 200,
      damping: 15,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [value]);

  // Movimiento del thumb
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.4],
  });

  // Zoom con rebote
  const scaleAnim = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  // Glow dinámico (efecto sombra más intensa cuando está activo)
  const shadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  // Color de los labels según activo
  const leftColor = value ? "#cccccc" : "#ffffff";
  const rightColor = value ? "#ffffff" : "#cccccc";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.track}
        onPress={() => onValueChange(!value)}
      >
        {/* Labels siempre visibles */}
        <View style={styles.inactiveContainer}>
          <Text style={[styles.inactiveText, { color: leftColor }]}>{leftLabel.text}</Text>
          <Text style={[styles.inactiveText, { color: rightColor }]}>{rightLabel.text}</Text>
        </View>

        {/* Thumb animado con glow */}
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }, { scale: scaleAnim }],
              shadowOpacity: shadowOpacity,
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
    width: width * 0.8,
    alignSelf: "center",
    marginVertical: 10,
  },
  track: {
    width: "100%",
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0f065a",
    justifyContent: "center",
    padding: 2,
  },
  thumb: {
    position: "absolute",
    width: "50%",
    height: 40,
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
    fontSize: 14,
    fontWeight: "600",
  },
  inactiveContainer: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  inactiveText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

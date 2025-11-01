import Ionicons from "@expo/vector-icons/Ionicons";
import { GlassView } from "expo-glass-effect";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { Text, View } from "./Themed";

import { useColorScheme } from "@/components/useColorScheme";

export const SignInButton = ({
  onPress,
  label = "Sign In",
}: {
  onPress?: () => void;
  label?: string;
}) => {
  const colorScheme = useColorScheme();
  return (
    <View
      style={[
        styles.signInContainer,
        { backgroundColor: colorScheme === "dark" ? "white" : "black" },
      ]}
      onTouchEnd={onPress}
    >
      <Text
        style={{
          color: colorScheme === "dark" ? "black" : "white",
          fontSize: 20,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  signInContainer: {
    width: 200,
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

type SquareButtonState = "disabled" | "active" | "loading";

export const SquareActionButton = ({
  onPress,
  state = "disabled",
  iconSize = 40,
  accessibilityLabel = "Continue",
}: {
  onPress?: () => void;
  state?: SquareButtonState;
  iconSize?: number;
  accessibilityLabel?: string;
}) => {
  const colorScheme = useColorScheme();
  const isPressable = state === "active";
  const disabledTint =
    colorScheme === "dark"
      ? "rgba(255,255,255,0.18)"
      : "rgba(255,255,255,0.25)";
  const activeTint =
    colorScheme === "dark"
      ? "rgba(120, 30, 190, 0.55)"
      : "rgba(63, 0, 58, 0.75)";
  const contentColor =
    state === "disabled" && colorScheme === "light"
      ? "rgba(255,255,255,0.85)"
      : "#FFFFFF";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={!isPressable}
      onPress={onPress}
      style={({ pressed }) => [
        squareButtonStyles.pressable,
        state === "active"
          ? squareButtonStyles.activeShadow
          : squareButtonStyles.disabledShadow,
        pressed && isPressable ? { transform: [{ scale: 0.96 }] } : null,
      ]}
    >
      <GlassView
        style={[
          squareButtonStyles.glass,
          state === "active"
            ? squareButtonStyles.glassActive
            : squareButtonStyles.glassDisabled,
        ]}
        tintColor={state === "active" ? activeTint : disabledTint}
        glassEffectStyle="regular"
        isInteractive={isPressable}
      >
        {state === "loading" ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={iconSize}
            color={contentColor}
          />
        )}
      </GlassView>
    </Pressable>
  );
};

const squareButtonStyles = StyleSheet.create({
  pressable: {
    width: 88,
    height: 88,
    borderRadius: 26,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  glass: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  glassActive: {
    backgroundColor: "rgba(124, 44, 220, 0.2)",
  },
  glassDisabled: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  activeShadow: {
    shadowColor: "rgba(124, 44, 220, 0.5)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  disabledShadow: {
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});

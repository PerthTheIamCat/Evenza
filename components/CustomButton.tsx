import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

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
  const disabledBackground =
    colorScheme === "dark"
      ? "rgba(255,255,255,0.25)"
      : "rgba(60, 15, 78, 0.25)";
  const activeBackground = "#3F003A";
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
        squareButtonStyles.base,
        {
          backgroundColor:
            state === "active" ? activeBackground : disabledBackground,
          opacity: pressed && isPressable ? 0.85 : 1,
        },
        state === "active" && squareButtonStyles.activeShadow,
      ]}
    >
      {state === "loading" ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Ionicons name="chevron-forward" size={iconSize} color={contentColor} />
      )}
    </Pressable>
  );
};

const squareButtonStyles = StyleSheet.create({
  base: {
    width: 88,
    height: 88,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  activeShadow: {
    shadowColor: "#6C1B93",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
});

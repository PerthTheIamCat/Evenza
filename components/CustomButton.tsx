import { StyleSheet } from "react-native";
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

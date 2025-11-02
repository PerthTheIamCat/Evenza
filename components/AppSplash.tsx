import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "./useColorScheme";

// A simple in-app splash screen to display while JS is loading resources/auth
export default function AppSplash() {
  const colorScheme = useColorScheme();

  const gradient =
    colorScheme === "dark"
      ? (["#1B264F", "#274690", "#330022"] as const)
      : (["#FFDEE9", "#B5FFFC", "#FFFFFF"] as const);

  const textPrimary = colorScheme === "dark" ? "#FFFFFF" : "#111111";
  const textSecondary = colorScheme === "dark" ? "#E6F2FB" : "#333333";
  const spinner = colorScheme === "dark" ? "#FFFFFF" : "#111111";

  return (
    <LinearGradient
      colors={gradient}
      locations={[0.1, 0.3, 0.9]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require("../assets/images/Evenza_LOGO.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: textPrimary }]}>Evenza</Text>
        <ActivityIndicator
          size="small"
          color={spinner}
          style={styles.spinner}
        />
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Loading your experience…
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 128,
    height: 128,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  spinner: {
    marginTop: 16,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 12,
  },
});

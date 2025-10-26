import { View } from "@/components/Themed";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";

import GradientText from "../GradientText";

export const LogoSmallWhiteOutline = () => {
  const colorScheme = useColorScheme();
  return (
    <View style={styles.logoContainer}>
      <View
        style={{
          backgroundColor: "transparent",
          flexDirection: "row",
          justifyContent: "space-around",
          width: 80,
        }}
      >
        <LinearGradient
          colors={
            colorScheme === "dark"
              ? ["#1B264F", "#330022"]
              : ["#FFDEE9", "#FFFFFF"]
          }
          style={styles.topLeftGradient}
          locations={[0.4, 0.9]}
        />
        <LinearGradient
          colors={
            colorScheme === "dark"
              ? ["#1B264F", "#330022"]
              : ["#FFDEE9", "#FFFFFF"]
          }
          style={styles.topLeftGradient}
          locations={[0.4, 0.9]}
        />
      </View>
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#1B264F", "#330022"]
            : ["#FFDEE9", "#FFFFFF"]
        }
        style={styles.innerBlock}
        locations={[0.4, 0.9]}
      >
        <GradientText colors={["#FFFFFF", "#999999"]} style={styles.logoText}>
          E
        </GradientText>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "white",
    fontSize: 48,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },
  innerBlock: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  topLeftGradient: {
    top: 0,
    left: 0,
    width: 16,
    height: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "white",
  },
});

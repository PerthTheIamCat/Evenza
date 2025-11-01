import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { SignInButton } from "@/components/CustomButton";
import { LogoSmallWhiteOutline } from "@/components/Logos/Logos";

import Ionicons from "@expo/vector-icons/Ionicons";

export default function Index() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#1B264F", "#274690", "#330022"]
            : ["#FFDEE9", "#B5FFFC", "#FFFFFF"]
        }
        style={styles.background}
        locations={[0.1, 0.3, 0.9]}
      >
        <SafeAreaView style={styles.container}>
          <View
            style={{
              backgroundColor: "transparent",
              alignItems: "center",
              marginBottom: 50,
            }}
          >
            <LogoSmallWhiteOutline />
            <Text style={{ fontSize: 48 }}>Evenza</Text>
            <Text style={{ fontSize: 20 }}>Create Share Celebrate</Text>
            <Ionicons
              name="people"
              size={58}
              color={`${colorScheme === "dark" ? "white" : "black"}`}
              style={{ marginTop: 30 }}
            />
            <Text
              style={{
                fontSize: 20,
                wordWrap: "break-word",
                width: 300,
                textAlign: "center",
              }}
            >
              Join a community that celebrates every moment.
            </Text>
            <Ionicons
              name="create"
              size={58}
              color={`${colorScheme === "dark" ? "white" : "black"}`}
              style={{ marginTop: 30 }}
            />
            <Text
              style={{
                fontSize: 20,
                wordWrap: "break-word",
                width: 300,
                textAlign: "center",
              }}
            >
              Start creating your special memories with Evenza today.
            </Text>
          </View>
          <SignInButton
            label="Get Started"
            onPress={() => {
              router.push("/signIn");
            }}
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
  },
  background: {
    flex: 1,
    width: "100%",
  },
});

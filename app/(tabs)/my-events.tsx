import { ScrollView, StyleSheet, View } from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { EventCard } from "@/components/EventCard";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import { events } from "@/constants/events";

export default function MyEventsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const gradient =
    colorScheme === "dark"
      ? (["#09124A", "#1B2C8D", "#350047"] as const)
      : (["#152E71", "#2240A0", "#4B0A74"] as const);

  const attending = events.slice(0, 3);

  return (
    <LinearGradient colors={gradient} style={styles.gradient} locations={[0, 0.45, 1]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Your Events</Text>
        <Text style={styles.subtitle}>
          Keep track of events you are hosting or attending.
        </Text>

        <View style={styles.list}>
          {attending.map((event) => (
            <EventCard
              key={event.id}
              item={event}
              onPress={(item) => router.push(`/home/event/${item.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 120,
    gap: 28,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    width: "85%",
  },
  list: {
    gap: 24,
  },
});

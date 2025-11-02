import { useCallback, useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import { useJoinedEvents } from "@/context/JoinedEventsContext";
import { useEvents } from "@/context/EventsContext";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { events } = useEvents();
  const { joinEvent, isJoined } = useJoinedEvents();

  const event = useMemo(
    () => events.find((item) => item.id === id),
    [events, id],
  );

  const alreadyJoined = event ? isJoined(event.id) : false;

  const handleJoin = useCallback(() => {
    if (event && !alreadyJoined) {
      joinEvent(event);
    }
  }, [alreadyJoined, event, joinEvent]);

  if (!event) {
    return null;
  }

  const gradient =
    colorScheme === "dark"
      ? (["#050A2F", "#1A2366", "#330036"] as const)
      : (["#11235E", "#1F3A8A", "#4B0B6F"] as const);

  return (
    <LinearGradient
      colors={gradient}
      style={styles.gradient}
      locations={[0, 0.4, 1]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.shareButton} onPress={() => {}}>
            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Image source={{ uri: event.image }} style={styles.heroImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.heroOverlay}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroCategory}>{event.category}</Text>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <Text style={styles.heroHeadline}>{event.headline}</Text>
          </View>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-clear-outline" size={22} color="#FFFFFF" />
            <Text style={styles.metaText}>{event.date}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={22} color="#FFFFFF" />
            <Text style={styles.metaText}>{event.time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={22} color="#FFFFFF" />
            <Text style={styles.metaText}>{event.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="wifi-outline" size={22} color="#FFFFFF" />
            <Text style={styles.metaText}>{event.mode}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to expect</Text>
          <Text style={styles.description}>
            Expect curated atmospheres, interactive installations, and surprise
            guest performers. We recommend arriving early to explore the pop-up
            lounges and art corners before the main show begins.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            alreadyJoined
              ? "Event already added to My Events"
              : "Join this event"
          }
          onPress={handleJoin}
          disabled={alreadyJoined}
          style={({ pressed }) => [
            styles.joinButton,
            alreadyJoined && styles.joinButtonDisabled,
            pressed && !alreadyJoined ? styles.joinButtonPressed : null,
          ]}
        >
          <Text style={styles.joinButtonText}>
            {alreadyJoined ? "Added to My Events" : "Joining"}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 200,
    gap: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    borderRadius: 32,
    overflow: "hidden",
    height: 260,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    gap: 6,
  },
  heroCategory: {
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1,
    fontSize: 13,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  heroHeadline: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
  },
  metaCard: {
    backgroundColor: "rgba(14, 21, 60, 0.7)",
    padding: 20,
    borderRadius: 24,
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  description: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 100,
    left: 24,
    right: 24,
    borderRadius: 28,
    backgroundColor: "rgba(12, 16, 46, 0.9)",
    padding: 24,
  },
  joinButton: {
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124, 44, 220, 0.4)",
  },
  joinButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  joinButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

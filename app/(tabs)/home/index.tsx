import { useMemo } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { SquareActionButton } from "@/components/CustomButton";
import { EventCard } from "@/components/EventCard";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import { useEvents } from "@/context/EventsContext";
import { useJoinedEvents } from "@/context/JoinedEventsContext";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { events } = useEvents();
  const { joinEvent, isJoined } = useJoinedEvents();

  const gradient =
    colorScheme === "dark"
      ? (["#0A144A", "#1B2C8D", "#320045"] as const)
      : (["#162E7A", "#2343A0", "#4A0A7D"] as const);

  const featuredEvent = useMemo(() => {
    if (events.length === 0) {
      return undefined;
    }
    return events.find((event) => event.isFeatured) ?? events[0];
  }, [events]);

  const popularEvents = useMemo(() => {
    return events.filter(
      (event) => event.isPopular && event.id !== featuredEvent?.id
    );
  }, [events, featuredEvent]);

  const upcomingEvents = useMemo(
    () =>
      events.filter((event) => {
        if (featuredEvent && event.id === featuredEvent.id) {
          return false;
        }
        return !event.isFeatured;
      }),
    [events, featuredEvent]
  );

  return (
    <LinearGradient
      colors={gradient}
      style={styles.gradient}
      locations={[0, 0.45, 1]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <View style={styles.brandAvatar}>
            <Text style={styles.brandInitial}>E</Text>
          </View>
          <View style={styles.greeting}>
            <Text style={styles.subtitle}>Welcome back</Text>
            <Text style={styles.title}>Discover new experiences</Text>
          </View>
          <Pressable
            style={styles.notificationButton}
            onPress={() => {}}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable style={styles.searchBar} onPress={() => {}}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.searchPlaceholder}>
            Search events, hosts, venues
          </Text>
        </Pressable>

        {featuredEvent && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Featured</Text>
            <EventCard
              item={featuredEvent}
              variant="featured"
              onPress={(item) => router.push(`/home/event/${item.id}`)}
              badge="Top pick"
            />
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Popular this week</Text>
          <Pressable onPress={() => {}}>
            <Text style={styles.actionText}>See all</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          snapToAlignment="center"
          decelerationRate="fast"
          snapToInterval={width * 0.75 + 20}
        >
          {popularEvents.map((event) => (
            <View key={event.id} style={styles.horizontalCard}>
              <EventCard
                item={event}
                variant="default"
                onPress={(item) => router.push(`/home/event/${item.id}`)}
                badge={event.isPopular ? "Popular" : undefined}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Upcoming</Text>
          <SquareActionButton
            state="active"
            iconSize={28}
            onPress={() => router.push("/create")}
            accessibilityLabel="Create an event"
          />
        </View>

        <View style={styles.upcomingList}>
          {upcomingEvents.map((event) => {
            const alreadyJoined = isJoined(event.id);
            return (
              <View key={event.id} style={styles.upcomingItem}>
                <EventCard
                  item={event}
                  variant="default"
                  onPress={(item) => router.push(`/home/event/${item.id}`)}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    alreadyJoined
                      ? "Event already in My Events"
                      : "Join this event"
                  }
                  onPress={() => {
                    if (!alreadyJoined) {
                      joinEvent(event);
                    }
                  }}
                  disabled={alreadyJoined}
                  style={({ pressed }) => [
                    styles.joiningButton,
                    alreadyJoined && styles.joiningButtonDisabled,
                    pressed && !alreadyJoined ? styles.joiningButtonPressed : null,
                  ]}
                >
                  <Text style={styles.joiningButtonText}>
                    {alreadyJoined ? "Added to My Events" : "Joining"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 120,
    gap: 28,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandAvatar: {
    width: 60,
    height: 60,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  brandInitial: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  greeting: {
    flex: 1,
    marginHorizontal: 18,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    height: 54,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 12,
  },
  searchPlaceholder: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
  },
  section: {
    gap: 20,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionText: {
    color: "rgba(255,255,255,0.7)",
    textDecorationLine: "underline",
  },
  horizontalList: {
    paddingVertical: 12,
    gap: 20,
  },
  horizontalCard: {
    width: width * 0.75,
  },
  upcomingList: {
    gap: 20,
  },
  upcomingItem: {
    gap: 12,
  },
  joiningButton: {
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124, 44, 220, 0.4)",
  },
  joiningButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  joiningButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  joiningButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

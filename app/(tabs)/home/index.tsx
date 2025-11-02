import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { EventCard } from "@/components/EventCard";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import type { EventItem } from "@/constants/events";
import { useAuthToken } from "@/context/AuthTokenContext";
import { useEvents } from "@/context/EventsContext";

const { width } = Dimensions.get("window");

const getEventTimestamp = (event: EventItem): number => {
  if (event.startDateTime) {
    const start = Date.parse(event.startDateTime);
    if (!Number.isNaN(start)) {
      return start;
    }
  }
  const fallback = Date.parse(event.date);
  if (!Number.isNaN(fallback)) {
    return fallback;
  }
  return Number.MAX_SAFE_INTEGER;
};

const getCreatedTimestamp = (event: EventItem): number => {
  if (event.createdAt) {
    const created = Date.parse(event.createdAt);
    if (!Number.isNaN(created)) {
      return created;
    }
  }
  return Number.MIN_SAFE_INTEGER;
};

const isTimestampKnown = (timestamp: number) =>
  Number.isFinite(timestamp) && timestamp !== Number.MAX_SAFE_INTEGER;

const isEventUpcoming = (event: EventItem, reference: number) => {
  const timestamp = getEventTimestamp(event);
  if (!isTimestampKnown(timestamp)) {
    return true;
  }
  return timestamp >= reference;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { events, refresh } = useEvents();
  const { user } = useAuthToken();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const gradient =
    colorScheme === "dark"
      ? (["#0A144A", "#1B2C8D", "#320045"] as const)
      : (["#162E7A", "#2343A0", "#4A0A7D"] as const);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const now = Date.now();

  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }
    return events
      .filter((event) => isEventUpcoming(event, now))
      .filter((event) => {
        const title = event.title?.toLowerCase() ?? "";
        const createdBy = event.createdBy?.toLowerCase() ?? "";
        return (
          title.includes(normalizedQuery) || createdBy.includes(normalizedQuery)
        );
      })
      .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
  }, [events, normalizedQuery, now]);

  const featuredEvents = useMemo(() => {
    if (events.length === 0) {
      return [];
    }
    return [...events]
      .filter((event) => isEventUpcoming(event, now))
      .slice(0, 3);
  }, [events, now]);

  const featuredEventIds = useMemo(() => {
    return new Set(featuredEvents.map((event) => event.id));
  }, [featuredEvents]);

  const popularEvents = useMemo(() => {
    return events.filter(
      (event) =>
        event.isPopular &&
        !featuredEventIds.has(event.id) &&
        isEventUpcoming(event, now)
    );
  }, [events, featuredEventIds, now]);

  const userEmail = user?.email ?? "";
  const profileInitial = userEmail.trim().charAt(0).toUpperCase() || "E";
  const headline = userEmail || "Discover new experiences";

  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => isEventUpcoming(event, now))
      .map((event) => {
        const timestamp = getEventTimestamp(event);
        return {
          event,
          timestamp,
          hasTimestamp:
            Number.isFinite(timestamp) && timestamp !== Number.MAX_SAFE_INTEGER,
        };
      })
      .sort((a, b) => {
        const deltaA = a.timestamp - now;
        const deltaB = b.timestamp - now;

        const isFutureA = a.hasTimestamp && deltaA >= 0;
        const isFutureB = b.hasTimestamp && deltaB >= 0;

        if (isFutureA && isFutureB) {
          return deltaA - deltaB;
        }
        if (isFutureA) {
          return -1;
        }
        if (isFutureB) {
          return 1;
        }

        if (a.hasTimestamp && b.hasTimestamp) {
          return deltaB - deltaA;
        }
        if (a.hasTimestamp) {
          return -1;
        }
        if (b.hasTimestamp) {
          return 1;
        }
        return a.event.title.localeCompare(b.event.title);
      })
      .map((item) => item.event);
  }, [events, now]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return (
    <LinearGradient
      colors={gradient}
      style={styles.gradient}
      locations={[0, 0.45, 1]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={["#FFFFFF"]}
            progressBackgroundColor="rgba(255,255,255,0.16)"
          />
        }
      >
        <View style={styles.heroRow}>
          <View style={styles.brandAvatar}>
            <Text style={styles.brandInitial}>{profileInitial}</Text>
          </View>
          <View style={styles.greeting}>
            <Text style={styles.subtitle}>Welcome back</Text>
            <Text style={styles.title}>{headline}</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="rgba(255,255,255,0.5)"
              />
            </Pressable>
          )}
        </View>

        {normalizedQuery ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Search results</Text>
              <Text style={styles.searchMeta}>
                {searchResults.length}{" "}
                {searchResults.length === 1 ? "event" : "events"}
              </Text>
            </View>
            {searchResults.length === 0 ? (
              <Text style={styles.emptyStateText}>
                No events match your search. Try a different keyword.
              </Text>
            ) : (
              <View style={styles.upcomingList}>
                {searchResults.map((event) => (
                  <View key={event.id} style={styles.upcomingItem}>
                    <EventCard
                      item={event}
                      variant="default"
                      onPress={(item) => router.push(`/home/event/${item.id}`)}
                      badge={"Match"}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {featuredEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Featured</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.featuredScroll}
                  contentContainerStyle={styles.featuredList}
                >
                  {featuredEvents.map((event, index) => {
                    const isLast = index === featuredEvents.length - 1;
                    return (
                      <View
                        key={event.id}
                        style={[
                          styles.featuredItem,
                          isLast && styles.featuredItemLast,
                        ]}
                      >
                        <EventCard
                          item={event}
                          onPress={(item) =>
                            router.push(`/home/event/${item.id}`)
                          }
                          badge="Suggested"
                        />
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Upcoming</Text>
            </View>

            <View style={styles.upcomingList}>
              {upcomingEvents.map((event) => (
                <View key={event.id} style={styles.upcomingItem}>
                  <EventCard
                    item={event}
                    variant="default"
                    onPress={(item) => router.push(`/home/event/${item.id}`)}
                  />
                </View>
              ))}
            </View>
          </>
        )}
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
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 0,
  },
  searchMeta: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.7)",
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
  featuredScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  featuredList: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingRight: 12,
  },
  featuredItem: {
    width: width * 0.8,
    marginRight: 20,
  },
  featuredItemLast: {
    marginRight: 0,
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
});

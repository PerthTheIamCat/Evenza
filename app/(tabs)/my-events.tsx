import { useCallback, useRef } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

import { EventCard } from "@/components/EventCard";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import { useJoinedEvents } from "@/context/JoinedEventsContext";
import type { EventItem } from "@/constants/events";

export default function MyEventsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { joinedEvents, leaveEvent } = useJoinedEvents();

  const handleEventPress = useCallback(
    (item: EventItem) => {
      router.push(`/home/event/${item.id}`);
    },
    [router],
  );

  const handleLeaveEvent = useCallback(
    (eventId: string) => {
      leaveEvent(eventId);
    },
    [leaveEvent],
  );

  const gradient =
    colorScheme === "dark"
      ? (["#09124A", "#1B2C8D", "#350047"] as const)
      : (["#152E71", "#2240A0", "#4B0A74"] as const);

  const hasEvents = joinedEvents.length > 0;

  return (
    <GestureHandlerRootView style={styles.root}>
      <LinearGradient
        colors={gradient}
        style={styles.gradient}
        locations={[0, 0.45, 1]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Your Events</Text>
          <Text style={styles.subtitle}>
            Keep track of events you are hosting or attending.
          </Text>
          {hasEvents ? (
            <View style={styles.list}>
              {joinedEvents.map((event) => (
                <JoinedEventRow
                  key={event.id}
                  event={event}
                  onView={handleEventPress}
                  onLeave={handleLeaveEvent}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyState}>
              Tap Joining on any event to add it to this list.
            </Text>
          )}
        </ScrollView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

type JoinedEventRowProps = {
  event: EventItem;
  onView: (item: EventItem) => void;
  onLeave: (eventId: string) => void;
};

const JoinedEventRow = ({ event, onView, onLeave }: JoinedEventRowProps) => {
  const swipeableRef = useRef<Swipeable | null>(null);

  const closeSwipeable = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleConfirmRemove = useCallback(() => {
    Alert.alert(
      "ลบอีเวนต์?",
      "แน่ใจหรือไม่ว่าต้องการนำอีเวนต์นี้ออกจาก My Events",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
          onPress: closeSwipeable,
        },
        {
          text: "ลบ",
          style: "destructive",
          onPress: () => {
            onLeave(event.id);
            closeSwipeable();
          },
        },
      ],
    );
  }, [closeSwipeable, event.id, onLeave]);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.deleteActionContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${event.title}`}
          onPress={handleConfirmRemove}
          style={({ pressed }) => [
            styles.deleteAction,
            pressed ? styles.deleteActionPressed : null,
          ]}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    ),
    [event.title, handleConfirmRemove],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      <View style={styles.cardWrapper}>
        <EventCard item={event} onPress={onView} />
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  cardWrapper: {
    borderRadius: 24,
    overflow: "hidden",
  },
  deleteActionContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: 12,
  },
  deleteAction: {
    width: 96,
    height: "100%",
    borderRadius: 24,
    backgroundColor: "rgba(231, 76, 60, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  deleteActionPressed: {
    opacity: 0.85,
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  emptyState: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 16,
  },
});

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
import { useEvents } from "@/context/EventsContext";
import { useJoinedEvents } from "@/context/JoinedEventsContext";
import type { EventItem } from "@/constants/events";
import { auth } from "@/lib/firebase";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

const SectionHeader = ({ title, actionLabel, onAction }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionLabel && onAction ? (
      <TouchableOpacity onPress={onAction} activeOpacity={0.8} hitSlop={8}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.sectionActionSpacer} />
    )}
  </View>
);

export default function MyEventsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { events } = useEvents();
  const { joinedEvents, leaveEvent } = useJoinedEvents();
  const currentUid = auth.currentUser?.uid ?? null;
  const [showAllCreated, setShowAllCreated] = useState(false);
  const [showAllJoined, setShowAllJoined] = useState(false);

  const createdEvents = useMemo(() => {
    if (!currentUid) {
      return [] as EventItem[];
    }
    return events.filter((event) => event.createdBy === currentUid);
  }, [events, currentUid]);

  const joinedFromOthers = useMemo(() => {
    if (!currentUid) {
      return joinedEvents;
    }
    return joinedEvents.filter((event) => event.createdBy !== currentUid);
  }, [joinedEvents, currentUid]);

  const gradient =
    colorScheme === "dark"
      ? (["#09124A", "#1B2C8D", "#350047"] as const)
      : (["#152E71", "#2240A0", "#4B0A74"] as const);

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

  const createdVisible = useMemo(() => {
    if (showAllCreated) {
      return createdEvents;
    }
    return createdEvents.slice(0, 1);
  }, [createdEvents, showAllCreated]);

  const joinedVisible = useMemo(() => {
    if (showAllJoined) {
      return joinedFromOthers;
    }
    return joinedFromOthers.slice(0, 1);
  }, [joinedFromOthers, showAllJoined]);

  const createdActionLabel =
    createdEvents.length > 1
      ? showAllCreated
        ? undefined
        : "See all"
      : "Create event";

  const joinedActionLabel =
    joinedFromOthers.length > 1
      ? showAllJoined
        ? undefined
        : "See all"
      : "Discover";

  const handleCreatedAction = () => {
    if (createdEvents.length > 1) {
      setShowAllCreated(true);
      return;
    }
    router.push("/create");
  };

  const handleJoinedAction = () => {
    if (joinedFromOthers.length > 1) {
      setShowAllJoined(true);
      return;
    }
    router.push("/home");
  };

  useEffect(() => {
    if (createdEvents.length <= 1 && showAllCreated) {
      setShowAllCreated(false);
    }
  }, [createdEvents.length, showAllCreated]);

  useEffect(() => {
    if (joinedFromOthers.length <= 1 && showAllJoined) {
      setShowAllJoined(false);
    }
  }, [joinedFromOthers.length, showAllJoined]);

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
          <View style={styles.header}>
            <Text style={styles.title}>Your Events</Text>
            <Text style={styles.subtitle}>
              Everything you are organizing and attending lives here.
            </Text>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Created"
              actionLabel={createdActionLabel}
              onAction={createdActionLabel ? handleCreatedAction : undefined}
            />
            {createdEvents.length > 0 ? (
              <View style={styles.cardList}>
                {createdVisible.map((event) => (
                  <View key={event.id} style={styles.cardWrapper}>
                    <EventCard item={event} onPress={handleEventPress} />
                  </View>
                ))}
                {!showAllCreated && createdEvents.length > 1 ? (
                  <Text style={styles.moreHint}>
                    {createdEvents.length - 1} more event
                    {createdEvents.length - 1 > 1 ? "s" : ""} saved — tap See all
                    to view.
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.emptyState}>
                Start hosting by creating your first event.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Joined"
              actionLabel={joinedActionLabel}
              onAction={joinedActionLabel ? handleJoinedAction : undefined}
            />
            {joinedFromOthers.length > 0 ? (
              <View style={styles.cardList}>
                {joinedVisible.map((event) => (
                  <JoinedEventRow
                    key={event.id}
                    event={event}
                    onView={handleEventPress}
                    onLeave={handleLeaveEvent}
                  />
                ))}
                {!showAllJoined && joinedFromOthers.length > 1 ? (
                  <Text style={styles.moreHint}>
                    {joinedFromOthers.length - 1} more event
                    {joinedFromOthers.length - 1 > 1 ? "s" : ""} waiting — tap
                    See all to view.
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.emptyState}>
                Browse events and tap Joining to save them here.
              </Text>
            )}
          </View>
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
      "Remove event?",
      "Leaving will remove this event from your list.",
      [
        { text: "Cancel", style: "cancel", onPress: closeSwipeable },
        {
          text: "Remove",
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
          accessibilityLabel={`Remove ${event.title}`}
          onPress={handleConfirmRemove}
          style={({ pressed }) => [
            styles.deleteAction,
            pressed ? styles.deleteActionPressed : null,
          ]}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={styles.deleteText}>Remove</Text>
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
    paddingBottom: 140,
    gap: 32,
  },
  header: {
    gap: 12,
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
  section: {
    gap: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "600",
  },
  sectionAction: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    textDecorationLine: "underline",
  },
  sectionActionSpacer: {
    width: 80,
    height: 20,
  },
  cardList: {
    gap: 20,
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: "hidden",
  },
  emptyState: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 16,
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
  moreHint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginTop: 4,
  },
});

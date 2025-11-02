import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView } from "expo-glass-effect";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import { useAuthToken } from "@/context/AuthTokenContext";
import { useEvents } from "@/context/EventsContext";
import { useJoinedEvents } from "@/context/JoinedEventsContext";
import { useNotificationPreferences } from "@/context/NotificationPreferencesContext";
import {
  sendEventCancellationEmail,
  sendJoinEventEmail,
} from "@/services/email.service";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { events, deleteEvent } = useEvents();
  const { joinEvent, isJoined, leaveEvent } = useJoinedEvents();
  const { user } = useAuthToken();
  const { preferences: notificationPreferences } = useNotificationPreferences();
  const userEmail = user?.email ?? null;
  const notifyOnJoin = notificationPreferences.notifyOnJoin;
  const notifyOnCancellation = notificationPreferences.notifyOnCancellation;
  const [deleting, setDeleting] = useState(false);

  const event = useMemo(
    () => events.find((item) => item.id === id),
    [events, id]
  );

  const alreadyJoined = event ? isJoined(event.id) : false;
  const canDelete =
    !!event &&
    event.source === "user" &&
    !!event.createdBy &&
    !!user?.uid &&
    event.createdBy === user.uid;
  const canEdit = canDelete;

  const handleJoin = useCallback(async () => {
    if (!event || alreadyJoined || canEdit) {
      return;
    }

    joinEvent(event);

    const recipientEmail = userEmail;
    if (!recipientEmail || !notifyOnJoin) {
      return;
    }

    await sendJoinEventEmail({
      recipientEmail,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      organizerEmail: event.createdBy,
    });
  }, [alreadyJoined, canEdit, event, joinEvent, notifyOnJoin, userEmail]);

  const handleEdit = useCallback(() => {
    if (!canEdit || !event) {
      return;
    }
    router.push({ pathname: "/create", params: { eventId: event.id } });
  }, [canEdit, event, router]);

  const performDelete = useCallback(async () => {
    if (!event || !user?.uid) {
      return;
    }
    setDeleting(true);
    const fallbackEvent = event;
    try {
      const result = await deleteEvent(event.id, user.uid);

      if (notifyOnCancellation) {
        const uniqueRecipients = Array.from(
          new Set(
            result.participants.filter(
              (email) => !!email && email !== userEmail
            )
          )
        );

        if (uniqueRecipients.length > 0) {
          try {
            await sendEventCancellationEmail({
              recipients: uniqueRecipients,
              eventTitle: result.title || fallbackEvent.title,
              eventDate: result.date || fallbackEvent.date,
              eventLocation: result.location || fallbackEvent.location,
              organizerEmail: userEmail ?? undefined,
            });
          } catch (emailError) {
            console.warn("Failed to send cancellation emails", emailError);
          }
        }
      }

      leaveEvent(event.id);

      Alert.alert("Event deleted", "Your event has been removed.");
      router.replace("/(tabs)/home");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete event. Please try again.";
      Alert.alert("Unable to delete event", message);
    } finally {
      setDeleting(false);
    }
  }, [
    deleteEvent,
    event,
    leaveEvent,
    notifyOnCancellation,
    router,
    user?.uid,
    userEmail,
  ]);

  const confirmDelete = useCallback(() => {
    if (!canDelete || deleting) {
      return;
    }
    Alert.alert(
      "Delete event",
      "This will cancel the event for everyone who joined. Do you want to continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void performDelete();
          },
        },
      ]
    );
  }, [canDelete, deleting, performDelete]);

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
            style={({ pressed }) => [
              styles.iconButtonPressable,
              pressed ? styles.iconButtonPressed : null,
            ]}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <GlassView
              style={styles.iconButtonGlass}
              tintColor="rgba(255,255,255,0.16)"
              glassEffectStyle="regular"
              isInteractive
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </GlassView>
          </Pressable>
          {canDelete ? (
            <Pressable
              style={({ pressed }) => [
                styles.iconButtonPressable,
                deleting ? styles.iconButtonDisabled : null,
                pressed && !deleting ? styles.iconButtonPressed : null,
              ]}
              onPress={confirmDelete}
              accessibilityLabel="Delete event"
              accessibilityRole="button"
              disabled={deleting}
            >
              <GlassView
                style={styles.iconButtonGlass}
                tintColor="rgba(255,255,255,0.16)"
                glassEffectStyle="regular"
                isInteractive={!deleting}
              >
                <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
              </GlassView>
            </Pressable>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {canEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit this event"
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.joinButton,
              pressed ? styles.joinButtonPressed : null,
            ]}
            disabled={deleting}
          >
            <Text style={styles.joinButtonText}>Edit event</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              alreadyJoined
                ? "Event already added to My Events"
                : "Join this event"
            }
            onPress={() => {
              void handleJoin();
            }}
            disabled={alreadyJoined || deleting}
            style={({ pressed }) => [
              styles.joinButton,
              (alreadyJoined || deleting) && styles.joinButtonDisabled,
              pressed && !alreadyJoined && !deleting
                ? styles.joinButtonPressed
                : null,
            ]}
          >
            <Text style={styles.joinButtonText}>
              {alreadyJoined ? "Added to My Events" : "Joining"}
            </Text>
          </Pressable>
        )}
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
  iconButtonPressable: {
    width: 48,
    height: 48,
    borderRadius: 18,
    overflow: "hidden",
  },
  iconButtonGlass: {
    flex: 1,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  iconButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  iconButtonPlaceholder: {
    width: 48,
    height: 48,
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

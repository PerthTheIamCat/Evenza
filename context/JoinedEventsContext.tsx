import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";

import type { EventItem, EventParticipant } from "@/constants/events";
import { useAuthToken } from "@/context/AuthTokenContext";
import { EVENTS_COLLECTION, useEvents } from "@/context/EventsContext";
import { db } from "@/lib/firebase";

type JoinedEventsContextValue = {
  joinedEvents: EventItem[];
  joinEvent: (event: EventItem) => void;
  isJoined: (eventId: string) => boolean;
  leaveEvent: (eventId: string) => void;
};

const JoinedEventsContext = createContext<JoinedEventsContextValue | undefined>(
  undefined
);

const STORAGE_PREFIX = "evenza.joinedEvents.";

const getStorageKey = (uid?: string | null) =>
  uid ? `${STORAGE_PREFIX}${uid}` : null;

const dedupeParticipants = (participants: EventParticipant[]) => {
  const seen = new Set<string>();
  return participants.filter((participant) => {
    const key = participant.email.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const areEventListsEqual = (left: EventItem[], right: EventItem[]) => {
  if (left.length !== right.length) {
    return false;
  }
  const leftIds = new Set(left.map((event) => event.id));
  for (const event of right) {
    if (!leftIds.has(event.id)) {
      return false;
    }
  }
  return true;
};

export function JoinedEventsProvider({ children }: { children: ReactNode }) {
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([]);
  const { user } = useAuthToken();
  const { events } = useEvents();
  const userEmail = user?.email ?? null;

  const persistEvents = useCallback(
    async (events: EventItem[]) => {
      const key = getStorageKey(user?.uid);
      if (!key) {
        return;
      }
      try {
        await AsyncStorage.setItem(key, JSON.stringify(events));
      } catch (error) {
        console.warn("Failed to persist joined events", error);
      }
    },
    [user?.uid]
  );

  useEffect(() => {
    const key = getStorageKey(user?.uid);
    if (!key) {
      setJoinedEvents([]);
      return;
    }

    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (!stored || !isMounted) {
          return;
        }
        const parsed = JSON.parse(stored) as EventItem[];
        setJoinedEvents(parsed);
      } catch (error) {
        console.warn("Failed to load joined events", error);
      }
    };

    hydrate().catch((error) => {
      console.warn("Failed to hydrate joined events", error);
    });

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const registerParticipation = useCallback(
    async (event: EventItem) => {
      if (event.source !== "user" || !userEmail) {
        return;
      }
      try {
        const eventRef = doc(db, EVENTS_COLLECTION, event.id);
        await updateDoc(eventRef, {
          participants: arrayUnion({
            email: userEmail,
            uid: user?.uid ?? null,
          }),
        });
      } catch (error) {
        console.warn("Failed to register event participation", error);
      }
    },
    [user?.uid, userEmail]
  );

  const joinEvent = useCallback(
    (event: EventItem) => {
      setJoinedEvents((previous) => {
        if (previous.some((item) => item.id === event.id)) {
          return previous;
        }

        const participantInfo =
          userEmail && event.source === "user"
            ? {
                email: userEmail,
                uid: user?.uid ?? null,
              }
            : null;

        const nextEvent = participantInfo
          ? {
              ...event,
              participants: dedupeParticipants([
                ...(event.participants ?? []),
                participantInfo,
              ]),
            }
          : event;

        const next = [...previous, nextEvent];
        void persistEvents(next);
        return next;
      });
      void registerParticipation(event);
    },
    [persistEvents, registerParticipation, user?.uid, userEmail]
  );

  const leaveEvent = useCallback((eventId: string) => {
    setJoinedEvents((previous) => {
      const next = previous.filter((item) => item.id !== eventId);
      if (next.length !== previous.length) {
        void persistEvents(next);
      }
      return next;
    });

    if (!userEmail) {
      return;
    }

    void (async () => {
      const targetEvent = events.find((event) => event.id === eventId);
      if (!targetEvent || targetEvent.source !== "user") {
        return;
      }

      try {
        const eventRef = doc(db, EVENTS_COLLECTION, eventId);
        await updateDoc(eventRef, {
          participants: arrayRemove({
            email: userEmail,
            uid: user?.uid ?? null,
          }),
        });
      } catch (error) {
        if (
          !(error instanceof Error &&
          "code" in error &&
          (error as { code?: string }).code === "not-found")
        ) {
          console.warn("Failed to remove event participation", error);
        }
      }
    })();
  }, [events, persistEvents, user?.uid, userEmail]);

  const isJoined = useCallback(
    (eventId: string) => joinedEvents.some((item) => item.id === eventId),
    [joinedEvents]
  );

  useEffect(() => {
    if (!userEmail) {
      setJoinedEvents((previous) => {
        if (previous.length === 0) {
          return previous;
        }
        void persistEvents([]);
        return [];
      });
      return;
    }

    const lowerEmail = userEmail.toLowerCase();
    const remoteJoined = events.filter((event) => {
      if (event.source !== "user") {
        return false;
      }
      if (!event.participants || event.participants.length === 0) {
        return false;
      }
      return event.participants.some(
        (participant) => participant.email.toLowerCase() === lowerEmail,
      );
    });

    setJoinedEvents((previous) => {
      const remoteIds = new Set(remoteJoined.map((event) => event.id));
      const extras = previous.filter(
        (event) => !remoteIds.has(event.id) && event.source !== "user",
      );
      const next = [...remoteJoined, ...extras];
      if (areEventListsEqual(previous, next)) {
        return previous;
      }
      void persistEvents(next);
      return next;
    });
  }, [events, persistEvents, userEmail]);

  const value = useMemo(
    () => ({
      joinedEvents,
      joinEvent,
      leaveEvent,
      isJoined,
    }),
    [joinedEvents, joinEvent, leaveEvent, isJoined]
  );

  return (
    <JoinedEventsContext.Provider value={value}>
      {children}
    </JoinedEventsContext.Provider>
  );
}

export function useJoinedEvents() {
  const context = useContext(JoinedEventsContext);

  if (!context) {
    throw new Error("useJoinedEvents must be used within JoinedEventsProvider");
  }

  return context;
}

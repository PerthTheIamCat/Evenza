import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { EventItem } from "@/constants/events";

type JoinedEventsContextValue = {
  joinedEvents: EventItem[];
  joinEvent: (event: EventItem) => void;
  isJoined: (eventId: string) => boolean;
  leaveEvent: (eventId: string) => void;
};

const JoinedEventsContext = createContext<JoinedEventsContextValue | undefined>(
  undefined,
);

export function JoinedEventsProvider({ children }: { children: ReactNode }) {
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([]);

  const joinEvent = useCallback((event: EventItem) => {
    setJoinedEvents((previous) => {
      if (previous.some((item) => item.id === event.id)) {
        return previous;
      }

      return [...previous, event];
    });
  }, []);

  const leaveEvent = useCallback((eventId: string) => {
    setJoinedEvents((previous) =>
      previous.filter((item) => item.id !== eventId),
    );
  }, []);

  const isJoined = useCallback(
    (eventId: string) => joinedEvents.some((item) => item.id === eventId),
    [joinedEvents],
  );

  const value = useMemo(
    () => ({
      joinedEvents,
      joinEvent,
      leaveEvent,
      isJoined,
    }),
    [joinedEvents, joinEvent, leaveEvent, isJoined],
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

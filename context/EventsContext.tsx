import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { readAsStringAsync } from "expo-file-system/legacy";
import { FirebaseError } from "firebase/app";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  EVENT_CATEGORIES,
  type EventCategory,
  type EventItem,
  type EventParticipant,
} from "@/constants/events";
import { auth, db } from "@/lib/firebase";

export type LocationType = "Onsite" | "Online";

export type CreateEventInput = {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  locationType: LocationType;
  imageUri: string;
  category: EventCategory;
};

export type UpdateEventInput = {
  eventId: string;
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  locationType: LocationType;
  imageUri: string | null;
  imageUpdated: boolean;
  category: EventCategory;
};

type DeleteEventResult = {
  title: string;
  date?: string;
  location?: string;
  participants: string[];
};

type EventsContextValue = {
  events: EventItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  createEvent: (input: CreateEventInput) => Promise<void>;
  updateEvent: (input: UpdateEventInput) => Promise<void>;
  deleteEvent: (
    eventId: string,
    requestorUid: string
  ) => Promise<DeleteEventResult>;
};

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

export const EVENTS_COLLECTION = "events";

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const formatTimeLabel = (date: Date) =>
  date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getDateFromValue = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const buildHeadline = (description: string) => {
  if (!description) {
    return "New event";
  }
  const singleLine = description.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 90) {
    return singleLine;
  }
  return `${singleLine.slice(0, 87)}...`;
};

const parseParticipants = (value: unknown): EventParticipant[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const collected: EventParticipant[] = [];
  for (const entry of value) {
    if (typeof entry === "string") {
      const email = entry.trim();
      if (email) {
        collected.push({ email });
      }
      continue;
    }

    if (entry && typeof entry === "object" && "email" in entry) {
      const emailValue = (entry as { email?: unknown }).email;
      if (typeof emailValue === "string" && emailValue.trim()) {
        const uidValue = (entry as { uid?: unknown }).uid;
        collected.push({
          email: emailValue.trim(),
          uid: typeof uidValue === "string" ? uidValue : null,
        });
      }
    }
  }

  const seen = new Set<string>();
  return collected.filter((participant) => {
    const key = participant.email.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const mapDocToEvent = (doc: QueryDocumentSnapshot<DocumentData>): EventItem => {
  const data = doc.data();
  const startDate = getDateFromValue(data.startDateTime);
  const endDate = getDateFromValue(data.endDateTime);

  const locationType =
    data.locationType === "Onsite" ? "Onsite" : ("Online" as LocationType);

  const categoryValue = data.category;
  const category = EVENT_CATEGORIES.includes(categoryValue as EventCategory)
    ? (categoryValue as EventCategory)
    : "General";

  const formattedStartDate = startDate ? formatDateLabel(startDate) : "";
  const formattedStartTime = startDate ? formatTimeLabel(startDate) : "";

  return {
    id: doc.id,
    title: data.title ?? "Untitled event",
    headline: data.headline ?? buildHeadline(data.description ?? ""),
    category,
    createdBy: data.createdBy ?? undefined,
    date: data.date ?? formattedStartDate,
    time: data.time ?? formattedStartTime,
    location:
      data.location ?? (locationType === "Onsite" ? "On site" : "Online event"),
    mode: locationType,
    description: data.description ?? "",
    image:
      data.imageUrl ??
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    startDateTime: startDate ? startDate.toISOString() : undefined,
    endDateTime: endDate ? endDate.toISOString() : undefined,
    source: "user",
    participants: parseParticipants(data.participants),
  };
};

const uploadImageToImgbb = async (uri: string) => {
  const apiKey = process.env.EXPO_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_IMGBB_API_KEY environment variable.");
  }

  const base64 = await readAsStringAsync(uri, {
    encoding: "base64",
  });

  const formData = new FormData();
  formData.append("image", base64);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });

  const json = await response.json();

  if (!response.ok || !json?.data?.url) {
    throw new Error("Failed to upload image to imgbb.");
  }

  return json.data.url as string;
};

export function EventsProvider({ children }: { children: ReactNode }) {
  const [remoteEvents, setRemoteEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const eventsCollection = collection(db, EVENTS_COLLECTION);
      const eventsQuery = query(eventsCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(eventsQuery);
      const mapped = snapshot.docs.map(mapDocToEvent);
      setRemoteEvents(mapped);
    } catch (error) {
      console.warn("Failed to load events", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = useCallback(async (input: CreateEventInput) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Please sign in before publishing an event.");
    }

    let activeUser = currentUser;
    try {
      await currentUser.reload();
      if (auth.currentUser) {
        activeUser = auth.currentUser;
      }
    } catch (error) {
      console.warn("Failed to refresh auth state before creating event", error);
    }

    if (!activeUser.emailVerified) {
      throw new Error("Please verify your email before publishing an event.");
    }

    const imageUrl = await uploadImageToImgbb(input.imageUri);

    const startDate = input.startDateTime;
    const endDate = input.endDateTime;

    const formattedDate = formatDateLabel(startDate);
    const formattedTime = formatTimeLabel(startDate);

    const headline = buildHeadline(input.description);
    const locationLabel =
      input.locationType === "Onsite" ? "On site" : "Online event";

    try {
      const eventsCollection = collection(db, EVENTS_COLLECTION);
      const docRef = await addDoc(eventsCollection, {
        title: input.title,
        description: input.description,
        headline,
        category: input.category,
        date: formattedDate,
        time: formattedTime,
        locationType: input.locationType,
        location: locationLabel,
        imageUrl,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        createdAt: serverTimestamp(),
        createdBy: activeUser.uid,
      });

      const newEvent: EventItem = {
        id: docRef.id,
        title: input.title,
        headline,
        category: input.category,
        createdBy: activeUser.uid,
        date: formattedDate,
        time: formattedTime,
        location: locationLabel,
        mode: input.locationType,
        description: input.description,
        image: imageUrl,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        source: "user",
        participants: [],
      };

      setRemoteEvents((previous) => [newEvent, ...previous]);
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === "permission-denied"
      ) {
        throw new Error(
          "Publishing requires a verified account. Please verify your email and try again."
        );
      }
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (input: UpdateEventInput) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Please sign in before updating an event.");
    }

    let activeUser = currentUser;
    try {
      await currentUser.reload();
      if (auth.currentUser) {
        activeUser = auth.currentUser;
      }
    } catch (error) {
      console.warn("Failed to refresh auth state before updating event", error);
    }

    const eventRef = doc(db, EVENTS_COLLECTION, input.eventId);
    const snapshot = await getDoc(eventRef);
    if (!snapshot.exists()) {
      throw new Error("Event not found or already deleted.");
    }

    const data = snapshot.data();
    if (data.createdBy && data.createdBy !== activeUser.uid) {
      throw new Error("You can only edit events you created.");
    }

    if (!input.startDateTime || !input.endDateTime) {
      throw new Error("Invalid event schedule.");
    }

    const startDate = input.startDateTime;
    const endDate = input.endDateTime;
    const formattedDate = formatDateLabel(startDate);
    const formattedTime = formatTimeLabel(startDate);
    const locationLabel =
      input.locationType === "Onsite" ? "On site" : "Online event";

    let imageUrl =
      (data.imageUrl as string | undefined) ??
      (data.image as string | undefined) ??
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";

    if (input.imageUpdated) {
      if (!input.imageUri) {
        throw new Error("Missing cover image.");
      }
      imageUrl = await uploadImageToImgbb(input.imageUri);
    }

    const headline = buildHeadline(input.description);

    await updateDoc(eventRef, {
      title: input.title,
      description: input.description,
      headline,
      date: formattedDate,
      time: formattedTime,
      locationType: input.locationType,
      location: locationLabel,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      imageUrl,
      category: input.category,
      updatedAt: serverTimestamp(),
    });

    const participants = parseParticipants(data.participants);

    const updated: EventItem = {
      id: input.eventId,
      title: input.title,
      headline,
      category: input.category,
      createdBy: (data.createdBy as string | undefined) ?? activeUser.uid,
      date: formattedDate,
      time: formattedTime,
      location: locationLabel,
      mode: input.locationType,
      description: input.description,
      image: imageUrl,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      source: "user",
      participants,
    };

    setRemoteEvents((previous) => {
      const exists = previous.some((event) => event.id === input.eventId);
      if (!exists) {
        return [updated, ...previous];
      }
      return previous.map((event) =>
        event.id === input.eventId ? updated : event
      );
    });
  }, []);

  const deleteEvent = useCallback(
    async (eventId: string, requestorUid: string) => {
      if (!eventId) {
        throw new Error("Missing event reference.");
      }
      if (!requestorUid) {
        throw new Error("You must be signed in to delete an event.");
      }

      try {
        const eventRef = doc(db, EVENTS_COLLECTION, eventId);
        const snapshot = await getDoc(eventRef);
        if (!snapshot.exists()) {
          throw new Error("Event not found or already deleted.");
        }

        const data = snapshot.data();
        if (data.createdBy && data.createdBy !== requestorUid) {
          throw new Error("You can only delete events you created.");
        }

        await deleteDoc(eventRef);
        setRemoteEvents((previous) =>
          previous.filter((event) => event.id !== eventId)
        );

        const participantEmails = parseParticipants(data.participants).map(
          (participant) => participant.email
        );

        return {
          title: (data.title as string | undefined) ?? "",
          date: (data.date as string | undefined) ?? "",
          location: (data.location as string | undefined) ?? "",
          participants: participantEmails,
        } as DeleteEventResult;
      } catch (error) {
        console.warn("Failed to delete event", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to delete event.");
      }
    },
    []
  );

  const combinedEvents = useMemo(() => remoteEvents, [remoteEvents]);

  const value = useMemo(
    () => ({
      events: combinedEvents,
      loading,
      refresh: fetchEvents,
      createEvent,
      updateEvent,
      deleteEvent,
    }),
    [combinedEvents, loading, fetchEvents, createEvent, updateEvent, deleteEvent]
  );

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within EventsProvider");
  }
  return context;
}

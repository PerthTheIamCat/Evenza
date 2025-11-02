import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as FileSystem from "expo-file-system";
import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";

import { events as staticEvents, type EventItem } from "@/constants/events";
import { auth, db } from "@/lib/firebase";

export type LocationType = "Onsite" | "Online";

export type CreateEventInput = {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  locationType: LocationType;
  imageUri: string;
};

type EventsContextValue = {
  events: EventItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  createEvent: (input: CreateEventInput) => Promise<void>;
};

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

const staticEventList = staticEvents.map((event) => ({
  ...event,
  source: "static" as const,
}));

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

const mapDocToEvent = (
  doc: QueryDocumentSnapshot<DocumentData>,
): EventItem => {
  const data = doc.data();
  const startDate = getDateFromValue(data.startDateTime);
  const endDate = getDateFromValue(data.endDateTime);

  const locationType =
    data.locationType === "Onsite" ? "Onsite" : ("Online" as LocationType);

  const formattedStartDate = startDate ? formatDateLabel(startDate) : "";
  const formattedStartTime = startDate ? formatTimeLabel(startDate) : "";

  return {
    id: doc.id,
    title: data.title ?? "Untitled event",
    headline: data.headline ?? buildHeadline(data.description ?? ""),
    category: data.category ?? "General",
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
  };
};

const uploadImageToImgbb = async (uri: string) => {
  const apiKey = process.env.EXPO_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_IMGBB_API_KEY environment variable.");
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const formData = new FormData();
  formData.append("image", base64);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    {
      method: "POST",
      body: formData,
    },
  );

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
      const eventsQuery = query(
        collection(db, "events"),
        orderBy("createdAt", "desc"),
      );
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

  const createEvent = useCallback(
    async (input: CreateEventInput) => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Please sign in before publishing an event.");
      }
      if (!user.emailVerified) {
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
        const docRef = await addDoc(collection(db, "events"), {
          title: input.title,
          description: input.description,
          headline,
          category: "General",
          date: formattedDate,
          time: formattedTime,
          locationType: input.locationType,
          location: locationLabel,
          imageUrl,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });

        const newEvent: EventItem = {
          id: docRef.id,
          title: input.title,
          headline,
          category: "General",
          date: formattedDate,
          time: formattedTime,
          location: locationLabel,
          mode: input.locationType,
          description: input.description,
          image: imageUrl,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          source: "user",
        };

        setRemoteEvents((previous) => [newEvent, ...previous]);
      } catch (error) {
        if (error instanceof FirebaseError && error.code === "permission-denied") {
          throw new Error(
            "Publishing requires a verified account. Please verify your email and try again.",
          );
        }
        throw error;
      }
    },
    [],
  );

  const combinedEvents = useMemo(() => {
    return [...remoteEvents, ...staticEventList];
  }, [remoteEvents]);

  const value = useMemo(
    () => ({
      events: combinedEvents,
      loading,
      refresh: fetchEvents,
      createEvent,
    }),
    [combinedEvents, loading, fetchEvents, createEvent],
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

export const EVENT_CATEGORIES = [
  "Music",
  "Tech",
  "Art",
  "Workshop",
  "General",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type EventParticipant = {
  email: string;
  uid?: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  headline: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  mode: "Online" | "Onsite";
  description: string;
  image: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  startDateTime?: string;
  endDateTime?: string;
  source?: "static" | "user";
  participants?: EventParticipant[];
};

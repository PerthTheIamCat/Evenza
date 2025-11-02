export type EventCategory = "Music" | "Tech" | "Art" | "Workshop" | "General";

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
  startDateTime?: string;
  endDateTime?: string;
  source?: "static" | "user";
  participants?: EventParticipant[];
};

export const events: EventItem[] = [
  {
    id: "dark-fest",
    title: "Dark Music Festival",
    headline: "Chapter III: Dying To See You",
    category: "Music",
    date: "Saturday, July 12",
    time: "18:00",
    location: "Centerpoint Studio, Bangkok",
    mode: "Onsite",
    description:
      "Dive into an unforgettable night of immersive electronic music curated by world-class DJs, laser artistry, and custom stage design. Dress in your boldest black fits and get ready to own the dance floor.",
    image:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80",
    isFeatured: true,
    isPopular: true,
  },
  {
    id: "future-sounds",
    title: "Future Sounds Bangkok",
    headline: "Immersive audio-visual encounters",
    category: "Music",
    date: "Friday, August 8",
    time: "19:30",
    location: "Glow Arena",
    mode: "Onsite",
    description:
      "A collaboration between rising producers and visual artists that blends live performances with jaw-dropping projections. Limited capacity—RSVP to secure your spot.",
    image:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
    isPopular: true,
  },
  {
    id: "voice-lab",
    title: "The Voice Lab",
    headline: "Make money with your voice",
    category: "Workshop",
    date: "Wednesday, October 1",
    time: "10:00",
    location: "Virtual",
    mode: "Online",
    description:
      "Learn voice-over fundamentals from industry trainers, understand gear that works on any budget, and practice scripts during live feedback sessions.",
    image:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "design-weekend",
    title: "Design Weekend",
    headline: "Experiential installations & talks",
    category: "Art",
    date: "Saturday, September 6",
    time: "09:30",
    location: "ICONSIAM Creative Hub",
    mode: "Onsite",
    description:
      "A curated weekend of design showcases, brand pop-ups, and creative talks with global innovators. Expect interactive labs, live typography battles, and more.",
    image:
      "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?auto=format&fit=crop&w=1400&q=80",
  },
];

export const featuredEvent = events.find((event) => event.isFeatured) ?? events[0];

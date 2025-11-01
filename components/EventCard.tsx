import { Image, Pressable, StyleSheet, View } from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { Text } from "@/components/Themed";
import type { EventItem } from "@/constants/events";

type EventCardProps = {
  item: EventItem;
  onPress?: (item: EventItem) => void;
  variant?: "featured" | "default" | "compact";
  badge?: string;
};

export const EventCard = ({
  item,
  onPress,
  variant = "default",
  badge,
}: EventCardProps) => {
  const isFeatured = variant === "featured";
  const borderRadius = isFeatured ? 28 : variant === "compact" ? 20 : 24;

  const card = (
    <LinearGradient
      colors={["rgba(13, 22, 70, 0.75)", "rgba(30, 0, 55, 0.85)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        {
          borderRadius,
          height: isFeatured ? 260 : variant === "compact" ? 160 : 200,
        },
      ]}
    >
      <Image
        source={{ uri: item.image }}
        resizeMode="cover"
        style={[styles.image, { borderRadius: borderRadius - 4 }]}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.9)"]}
        style={[styles.overlay, { borderRadius: borderRadius - 4 }]}
      />
      <View style={styles.content}>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.headline}>{item.headline}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{item.date}</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{item.time}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  if (!onPress) {
    return card;
  }

  return (
    <Pressable onPress={() => onPress(item)} style={{ marginBottom: 20 }}>
      {card}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F74B7F",
    color: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 14,
    fontWeight: "600",
  },
  category: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  headline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  meta: {
    color: "rgba(255,255,255,0.7)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});

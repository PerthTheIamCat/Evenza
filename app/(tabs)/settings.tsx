import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { useState } from "react";

import { LinearGradient } from "expo-linear-gradient";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";

const settingItems = [
  { key: "notifyEvents", label: "Event reminders" },
  { key: "notifyUpdates", label: "Product updates" },
  { key: "notifyOffers", label: "Exclusive offers" },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    notifyEvents: true,
    notifyUpdates: false,
    notifyOffers: true,
  });

  const gradient =
    colorScheme === "dark"
      ? (["#080F3C", "#1A2671", "#300141"] as const)
      : (["#142860", "#223C92", "#4B0A74"] as const);

  return (
    <LinearGradient colors={gradient} style={styles.gradient} locations={[0, 0.4, 1]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Personalize notifications and preferences.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          {settingItems.map((item) => (
            <View key={item.key} style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingDescription}>
                  Stay in the loop with curated updates.
                </Text>
              </View>
              <Switch
                value={toggles[item.key]}
                onValueChange={(value) =>
                  setToggles((prev) => ({
                    ...prev,
                    [item.key]: value,
                  }))
                }
                thumbColor={toggles[item.key] ? "#6A6DFF" : "#DAD9F5"}
                trackColor={{ false: "rgba(255,255,255,0.2)", true: "rgba(106,109,255,0.45)" }}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Support</Text>
          <Text style={styles.settingLabel}>Help Center</Text>
          <Text style={styles.settingDescription}>
            Browse FAQs or reach out to the Evenza team.
          </Text>
          <Text style={[styles.settingLabel, { marginTop: 18 }]}>Terms & Privacy</Text>
          <Text style={styles.settingDescription}>
            Review how we collect and secure your information.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    width: "80%",
  },
  section: {
    backgroundColor: "rgba(9, 15, 46, 0.6)",
    borderRadius: 26,
    padding: 20,
    gap: 20,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  settingDescription: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    marginTop: 4,
  },
});

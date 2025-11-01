import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { SquareActionButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";

export default function CreateEventScreen() {
  const colorScheme = useColorScheme();

  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
  });

  const gradient =
    colorScheme === "dark"
      ? (["#06103F", "#15286F", "#320045"] as const)
      : (["#142B6F", "#233E97", "#4B0A75"] as const);

  const isFormValid =
    form.name.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.startDate.trim().length > 0 &&
    form.startTime.trim().length > 0 &&
    form.location.trim().length > 0;

  return (
    <LinearGradient
      colors={gradient}
      style={styles.gradient}
      locations={[0, 0.45, 1]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View>
              <Text style={styles.title}>Create New Event</Text>
              <Text style={styles.subtitle}>
                Share a memorable experience with the community.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Basics</Text>
              <CustomInput
                placeholder="Event Name"
                value={form.name}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, name: value }))
                }
                containerStyle={styles.inputSpacing}
                iconName="sparkles-outline"
              />
              <CustomInput
                placeholder="Details"
                value={form.description}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, description: value }))
                }
                containerStyle={styles.inputSpacing}
                iconName="document-text-outline"
                multiline
                numberOfLines={3}
                style={{ height: 90, textAlignVertical: "top" }}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date & time</Text>
              <View style={styles.row}>
                <CustomInput
                  placeholder="Start date"
                  value={form.startDate}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, startDate: value }))
                  }
                  containerStyle={styles.flexInput}
                  iconName="calendar-outline"
                />
                <CustomInput
                  placeholder="Start time"
                  value={form.startTime}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, startTime: value }))
                  }
                  containerStyle={styles.flexInput}
                  iconName="time-outline"
                />
              </View>
              <View style={styles.row}>
                <CustomInput
                  placeholder="End date"
                  value={form.endDate}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, endDate: value }))
                  }
                  containerStyle={styles.flexInput}
                  iconName="calendar-outline"
                />
                <CustomInput
                  placeholder="End time"
                  value={form.endTime}
                  onChangeText={(value) =>
                    setForm((prev) => ({ ...prev, endTime: value }))
                  }
                  containerStyle={styles.flexInput}
                  iconName="time-outline"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Venue</Text>
              <CustomInput
                placeholder="Location"
                value={form.location}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, location: value }))
                }
                containerStyle={styles.inputSpacing}
                iconName="location-outline"
              />
            </View>

            <View style={styles.actionRow}>
              <Text style={styles.hintText}>
                You can update details after publishing.
              </Text>
            <SquareActionButton
              state={isFormValid ? "active" : "disabled"}
              onPress={() => {}}
              accessibilityLabel="Publish event"
              iconSize={34}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    gap: 36,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    marginTop: 8,
    width: "85%",
  },
  section: {
    backgroundColor: "rgba(10, 16, 58, 0.55)",
    borderRadius: 26,
    padding: 20,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  inputSpacing: {
    marginTop: 18,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginTop: 18,
  },
  flexInput: {
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    width: "65%",
  },
});

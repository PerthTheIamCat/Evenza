import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";

import { SquareActionButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import { EVENT_CATEGORIES, type EventCategory } from "@/constants/events";
import { type LocationType, useEvents } from "@/context/EventsContext";

type EventDateField = "start" | "end";

type FormState = {
  name: string;
  description: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  locationType: LocationType;
  category: EventCategory;
};

const defaultFormState: FormState = {
  name: "",
  description: "",
  startDateTime: null,
  endDateTime: null,
  locationType: "Onsite",
  category: "General",
};

export default function CreateEventScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const { events, createEvent, updateEvent, loading } = useEvents();
  const editingId = typeof params.eventId === "string" ? params.eventId : undefined;
  const isEditMode = !!editingId;
  const editingEvent = useMemo(
    () => events.find((event) => event.id === editingId),
    [events, editingId]
  );

  const [form, setForm] = useState<FormState>(defaultFormState);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [iosPickerState, setIosPickerState] = useState<{
    field: EventDateField;
    mode: "date" | "time";
  } | null>(null);
  const [iosPickerValue, setIosPickerValue] = useState<Date>(new Date());
  const [coverChanged, setCoverChanged] = useState(false);
  const [initializedFromEvent, setInitializedFromEvent] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setInitializedFromEvent(false);
    } else {
      setForm(defaultFormState);
      setImageUri(null);
      setCoverChanged(false);
      setInitializedFromEvent(false);
    }
  }, [editingId, isEditMode]);

  const gradient =
    colorScheme === "dark"
      ? (["#06103F", "#15286F", "#320045"] as const)
      : (["#142B6F", "#233E97", "#4B0A75"] as const);

  const trimmedName = useMemo(() => form.name.trim(), [form.name]);
  const trimmedDescription = useMemo(
    () => form.description.trim(),
    [form.description]
  );
  const headingTitle = isEditMode ? "Edit Event" : "Create New Event";
  const subtitleCopy = isEditMode
    ? "Refresh the details so attendees stay in the loop."
    : "Share a memorable experience with the community.";
  const hintCopy = isEditMode
    ? "Changes are saved instantly for everyone."
    : "You can update details after publishing.";
  const actionAccessibilityLabel = isEditMode
    ? "Save event changes"
    : "Publish event";

  useEffect(() => {
    if (!isEditMode) {
      return;
    }
    if (!editingEvent || initializedFromEvent) {
      return;
    }

    const parseDateTime = (value?: string | null) => {
      if (!value) {
        return null;
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const startDateTime = parseDateTime(editingEvent.startDateTime);
    const endDateTime = parseDateTime(editingEvent.endDateTime);

    setForm({
      name: editingEvent.title ?? "",
      description: editingEvent.description ?? "",
      startDateTime: startDateTime ?? new Date(),
      endDateTime: endDateTime ?? startDateTime ?? new Date(),
      locationType: editingEvent.mode,
      category: editingEvent.category ?? "General",
    });
    setImageUri(editingEvent.image);
    setCoverChanged(false);
    setInitializedFromEvent(true);
  }, [editingEvent, initializedFromEvent, isEditMode]);

  useEffect(() => {
    if (!isEditMode || loading || initializedFromEvent) {
      return;
    }
    if (!editingEvent) {
      Alert.alert(
        "Event not found",
        "We couldn't find this event. It may have been removed."
      );
      router.replace("/home");
    }
  }, [editingEvent, initializedFromEvent, isEditMode, loading, router]);

  const formatDate = useCallback((value: Date | null) => {
    if (!value) {
      return "";
    }
    return value.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const formatTime = useCallback((value: Date | null) => {
    if (!value) {
      return "";
    }
    return value.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const startDateLabel = useMemo(
    () => formatDate(form.startDateTime),
    [formatDate, form.startDateTime]
  );
  const startTimeLabel = useMemo(
    () => formatTime(form.startDateTime),
    [formatTime, form.startDateTime]
  );
  const endDateLabel = useMemo(
    () => formatDate(form.endDateTime),
    [formatDate, form.endDateTime]
  );
  const endTimeLabel = useMemo(
    () => formatTime(form.endDateTime),
    [formatTime, form.endDateTime]
  );

  const setDatePart = useCallback((field: EventDateField, date: Date) => {
    setForm((prev) => {
      const key = field === "start" ? "startDateTime" : "endDateTime";
      const previous = prev[key];
      const base = previous ? new Date(previous) : new Date(date);
      base.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      return { ...prev, [key]: base };
    });
  }, []);

  const setTimePart = useCallback((field: EventDateField, time: Date) => {
    setForm((prev) => {
      const key = field === "start" ? "startDateTime" : "endDateTime";
      const previous = prev[key];
      const base = previous ? new Date(previous) : new Date(time);
      base.setHours(time.getHours(), time.getMinutes(), 0, 0);
      return { ...prev, [key]: base };
    });
  }, []);

  const openPicker = useCallback(
    (field: EventDateField, mode: "date" | "time") => {
      const currentValue =
        form[field === "start" ? "startDateTime" : "endDateTime"] ?? new Date();

      if (Platform.OS === "android") {
        DateTimePickerAndroid.open({
          value: currentValue,
          mode,
          is24Hour: true,
          onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
            if (event.type !== "set" || !selectedDate) {
              return;
            }
            if (mode === "date") {
              setDatePart(field, selectedDate);
            } else {
              setTimePart(field, selectedDate);
            }
          },
        });
        return;
      }

      setIosPickerValue(currentValue);
      setIosPickerState({ field, mode });
    },
    [form, setDatePart, setTimePart]
  );

  const closeIosPicker = useCallback(() => {
    setIosPickerState(null);
  }, []);

  const handleIosConfirm = useCallback(() => {
    if (!iosPickerState) {
      return;
    }
    if (iosPickerState.mode === "date") {
      setDatePart(iosPickerState.field, iosPickerValue);
    } else {
      setTimePart(iosPickerState.field, iosPickerValue);
    }
    setIosPickerState(null);
  }, [iosPickerState, iosPickerValue, setDatePart, setTimePart]);

  const ensureMediaLibraryPermission = useCallback(async () => {
    const currentPermission =
      await ImagePicker.getMediaLibraryPermissionsAsync();

    if (
      currentPermission.granted ||
      currentPermission.status === "granted" ||
      currentPermission.accessPrivileges === "limited"
    ) {
      return true;
    }

    const requestedPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (
      requestedPermission.granted ||
      requestedPermission.status === "granted" ||
      requestedPermission.accessPrivileges === "limited"
    ) {
      return true;
    }

    Alert.alert(
      "Permission required",
      Platform.OS === "ios"
        ? "Allow Evenza to access your photo library from Settings > Privacy."
        : "Allow Evenza to access your photos in Settings before picking a cover image."
    );
    return false;
  }, []);

  const handleSelectImage = useCallback(async () => {
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
        setCoverChanged(true);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't open your gallery. Please try again.";
      Alert.alert("Image picker failed", message);
    }
  }, [ensureMediaLibraryPermission]);

  const isDateRangeValid = useMemo(() => {
    if (!form.startDateTime || !form.endDateTime) {
      return true;
    }
    return form.endDateTime.getTime() >= form.startDateTime.getTime();
  }, [form.endDateTime, form.startDateTime]);

  const handlePublish = useCallback(async () => {
    if (!form.startDateTime || !form.endDateTime) {
      Alert.alert(
        "Missing date & time",
        "Please choose both start and end date/time before saving."
      );
      return;
    }

    if (!isDateRangeValid) {
      Alert.alert(
        "Invalid range",
        "End date and time must be the same or later than the start date and time."
      );

      return;
    }

    if (!imageUri) {
      Alert.alert(
        "Cover image required",
        "Pick a cover image before saving your event."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && editingId) {
        await updateEvent({
          eventId: editingId,
          title: trimmedName,
          description: trimmedDescription,
          startDateTime: form.startDateTime,
          endDateTime: form.endDateTime,
          locationType: form.locationType,
          category: form.category,
          imageUri,
          imageUpdated: coverChanged,
        });
        setCoverChanged(false);
        Alert.alert("Event updated", "Your changes have been saved.");
        router.replace(`/home/event/${editingId}`);
      } else {
        await createEvent({
          title: trimmedName,
          description: trimmedDescription,
          startDateTime: form.startDateTime,
          endDateTime: form.endDateTime,
          locationType: form.locationType,
          category: form.category,
          imageUri,
        });
        setForm(() => ({ ...defaultFormState }));
        setImageUri(null);
        setCoverChanged(false);
        router.push("/home");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't save your event. Please try again.";
      Alert.alert("Save failed", message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    coverChanged,
    createEvent,
    editingId,
    form.endDateTime,
    form.locationType,
    form.startDateTime,
    imageUri,
    isDateRangeValid,
    isEditMode,
    router,
    trimmedDescription,
    trimmedName,
    updateEvent,
  ]);

  const isFormComplete =
    trimmedName.length > 0 &&
    trimmedDescription.length > 0 &&
    form.startDateTime !== null &&
    form.endDateTime !== null &&
    imageUri !== null;

  const isPublishEnabled = isFormComplete && isDateRangeValid && !isSubmitting;

  const actionButtonState: "disabled" | "active" | "loading" = isSubmitting
    ? "loading"
    : isPublishEnabled
    ? "active"
    : "disabled";

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
            <Text style={styles.title}>{headingTitle}</Text>
            <Text style={styles.subtitle}>{subtitleCopy}</Text>
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
            />
            <View style={styles.categoryWrapper}>
              <Text style={styles.categoryLabel}>Category</Text>
              <View style={styles.categoryChipsRow}>
                {EVENT_CATEGORIES.map((option) => {
                  const isSelected = form.category === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${option} category`}
                      onPress={() =>
                        setForm((prev) => ({ ...prev, category: option }))
                      }
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cover image</Text>
            <Pressable
              style={styles.imagePicker}
              accessibilityRole="button"
              accessibilityLabel="Select cover image"
              onPress={handleSelectImage}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={32}
                    color="rgba(255,255,255,0.65)"
                  />
                  <Text style={styles.imagePlaceholderText}>
                    Tap to upload a cover image
                  </Text>
                </View>
              )}
            </Pressable>
            <Text style={styles.imageHint}>
              Supports JPG or PNG, at least 1200px wide
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date & time</Text>
            <View style={styles.row}>
              <DateField
                label="Start date"
                placeholder="Select date"
                value={startDateLabel}
                iconName="calendar-outline"
                onPress={() => openPicker("start", "date")}
              />
              <DateField
                label="Start time"
                placeholder="Select time"
                value={startTimeLabel}
                iconName="time-outline"
                onPress={() => openPicker("start", "time")}
              />
            </View>
            <View style={styles.row}>
              <DateField
                label="End date"
                placeholder="Select date"
                value={endDateLabel}
                iconName="calendar-outline"
                onPress={() => openPicker("end", "date")}
              />
              <DateField
                label="End time"
                placeholder="Select time"
                value={endTimeLabel}
                iconName="time-outline"
                onPress={() => openPicker("end", "time")}
              />
            </View>
            {form.startDateTime && form.endDateTime && !isDateRangeValid && (
              <Text style={styles.errorText}>
                End date and time must not be earlier than the start date and
                time.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            <View style={styles.locationToggleRow}>
              {(["Onsite", "Online"] as LocationType[]).map((option) => {
                const isActive = form.locationType === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${option}`}
                    onPress={() =>
                      setForm((prev) => ({ ...prev, locationType: option }))
                    }
                    style={[
                      styles.locationOption,
                      isActive && styles.locationOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.locationOptionLabel,
                        isActive && styles.locationOptionLabelActive,
                      ]}
                    >
                      {option === "Onsite" ? "On site" : "Online"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.locationHint}>
              {form.locationType === "Onsite"
                ? "Select On site if guests will attend in person."
                : "Choose Online for virtual sessions and share details later."}
            </Text>
            <View style={styles.actionRow}>
              <Text style={styles.hintText}>{hintCopy}</Text>
              <SquareActionButton
                state={actionButtonState}
                onPress={handlePublish}
                accessibilityLabel={actionAccessibilityLabel}
                iconSize={34}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === "ios" && iosPickerState ? (
        <Modal transparent animationType="slide">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel selection"
                  onPress={closeIosPicker}
                >
                  <Text style={styles.pickerModalAction}>Cancel</Text>
                </Pressable>
                <Text style={styles.pickerModalTitle}>
                  {iosPickerState.mode === "date"
                    ? "Select date"
                    : "Select time"}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Confirm selection"
                  onPress={handleIosConfirm}
                >
                  <Text style={styles.pickerModalAction}>Confirm</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosPickerValue}
                mode={iosPickerState.mode}
                display="spinner"
                is24Hour
                onChange={(_, selected) => {
                  if (selected) {
                    setIosPickerValue(selected);
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </LinearGradient>
  );
}

type DateFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  iconName: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
};

const DateField = ({
  label,
  placeholder,
  value,
  iconName,
  onPress,
}: DateFieldProps) => {
  const hasValue = value.length > 0;

  return (
    <Pressable
      style={styles.pickerButton}
      accessibilityRole="button"
      accessibilityLabel={`${label} field`}
      onPress={onPress}
    >
      <Ionicons
        name={iconName}
        size={22}
        color="#FFFFFF"
        style={styles.pickerIcon}
      />
      <View style={styles.pickerTextWrapper}>
        <Text style={styles.pickerLabel}>{label}</Text>
        <Text style={hasValue ? styles.pickerValue : styles.pickerPlaceholder}>
          {hasValue ? value : placeholder}
        </Text>
      </View>
    </Pressable>
  );
};

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
  categoryWrapper: {
    marginTop: 18,
  },
  categoryLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "500",
  },
  categoryChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  categoryChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  categoryChipActive: {
    backgroundColor: "rgba(124, 44, 220, 0.45)",
    borderColor: "rgba(124, 44, 220, 0.85)",
  },
  categoryChipText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginTop: 18,
  },
  pickerButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pickerIcon: {
    marginRight: 12,
  },
  pickerTextWrapper: {
    flex: 1,
    gap: 4,
  },
  pickerLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  pickerValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  pickerPlaceholder: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 18,
  },
  errorText: {
    marginTop: 12,
    color: "#FF6B6B",
    fontSize: 14,
  },
  imagePicker: {
    marginTop: 18,
    height: 200,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  imagePlaceholderText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    fontWeight: "500",
  },
  imageHint: {
    marginTop: 12,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  locationToggleRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  locationOption: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  locationOptionActive: {
    backgroundColor: "rgba(124, 44, 220, 0.45)",
    borderColor: "rgba(124, 44, 220, 0.85)",
  },
  locationOptionLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    fontWeight: "500",
  },
  locationOptionLabelActive: {
    color: "#FFFFFF",
  },
  locationHint: {
    marginTop: 16,
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
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
  pickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerModalContent: {
    backgroundColor: "#0A103A",
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pickerModalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  pickerModalAction: {
    color: "#7C2CDC",
    fontSize: 16,
    fontWeight: "600",
  },
});

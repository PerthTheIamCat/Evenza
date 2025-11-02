import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Badge,
  Label,
  Icon as NativeTabIcon,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";

import { useJoinedEvents } from "@/context/JoinedEventsContext";

export default function TabLayout() {
  const { joinedEvents } = useJoinedEvents();
  const attendingCount = joinedEvents.length;

  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="home">
        <NativeTabIcon
          src={<VectorIcon family={Ionicons} name="home-outline" />}
        />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="my-events">
        <NativeTabIcon
          src={<VectorIcon family={Ionicons} name="calendar-outline" />}
        />
        <Label>My Events</Label>
        <Badge>{String(attendingCount)}</Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <NativeTabIcon
          src={<VectorIcon family={Ionicons} name="add-circle-outline" />}
        />
        <Label>Create</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabIcon
          src={<VectorIcon family={Ionicons} name="settings-outline" />}
        />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

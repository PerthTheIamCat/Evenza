import Ionicons from "@expo/vector-icons/Ionicons";
import {
  NativeTabs,
  Icon as NativeTabIcon,
  Label,
  Badge,
  VectorIcon,
} from "expo-router/unstable-native-tabs";

import { events } from "@/constants/events";

export default function TabLayout() {
  const attendingCount = events.slice(0, 3).length;

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <NativeTabIcon src={<VectorIcon family={Ionicons} name="home-outline" />} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="my-events">
        <NativeTabIcon src={<VectorIcon family={Ionicons} name="calendar-outline" />} />
        <Label>My Events</Label>
        <Badge>{String(attendingCount)}</Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <NativeTabIcon src={<VectorIcon family={Ionicons} name="add-circle-outline" />} />
        <Label>Create</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabIcon src={<VectorIcon family={Ionicons} name="settings-outline" />} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

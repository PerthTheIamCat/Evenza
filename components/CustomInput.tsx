import { useEffect, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import type { TextInputProps } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

import { useColorScheme } from "./useColorScheme";

type InputStatus = "default" | "error";

type CustomInputProps = TextInputProps & {
  status?: InputStatus;
  iconName?: ComponentProps<typeof Ionicons>["name"];
  containerStyle?: StyleProp<ViewStyle>;
};

export const CustomInput = ({
  status = "default",
  style: inputStyle,
  containerStyle,
  iconName,
  editable = true,
  autoCapitalize = "none",
  secureTextEntry,
  ...props
}: CustomInputProps) => {
  const colorScheme = useColorScheme();
  const palette =
    colorScheme === "dark"
      ? {
          text: "#FFFFFF",
          placeholder: "rgba(255,255,255,0.6)",
          border: "rgba(255,255,255,0.8)",
          icon: "rgba(255,255,255,0.85)",
        }
      : {
          text: "#FFFFFF",
          placeholder: "rgba(255,255,255,0.65)",
          border: "rgba(255,255,255,0.85)",
          icon: "rgba(255,255,255,0.85)",
        };

  const isError = status === "error";
  const borderColor = isError ? "#FF3B30" : palette.border;
  const textColor = isError ? "#FF3B30" : palette.text;
  const [isPasswordHidden, setPasswordHidden] = useState<boolean>(
    !!secureTextEntry,
  );

  useEffect(() => {
    setPasswordHidden(!!secureTextEntry);
  }, [secureTextEntry]);

  const showPasswordToggle = !!secureTextEntry;
  const iconColor = isError ? "#FF3B30" : palette.icon;
  const inputTextStyle = inputStyle as StyleProp<TextStyle>;

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }, containerStyle]}>
      {iconName && (
        <Ionicons name={iconName} size={26} color={iconColor} style={styles.leadingIcon} />
      )}
      <TextInput
        {...props}
        editable={editable}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        secureTextEntry={showPasswordToggle ? isPasswordHidden : secureTextEntry}
        placeholderTextColor={palette.placeholder}
        style={[
          styles.input,
          {
            color: textColor,
            opacity: editable ? 1 : 0.75,
          },
          inputTextStyle,
        ]}
      />
      {showPasswordToggle && (
        <TouchableOpacity
          onPress={() => setPasswordHidden((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={isPasswordHidden ? "Show password" : "Hide password"}
          hitSlop={8}
        >
          <Ionicons
            name={isPasswordHidden ? "eye-off" : "eye"}
            size={24}
            color={iconColor}
            style={styles.trailingIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderBottomWidth: 1.5,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 20,
  },
  leadingIcon: {
    marginRight: 12,
  },
  trailingIcon: {
    marginLeft: 12,
  },
});

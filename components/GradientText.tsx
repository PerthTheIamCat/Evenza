import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text as RNText, TextProps as RNTextProps } from "react-native";

type GradientTextProps = RNTextProps & {
  colors: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children: React.ReactNode;
};

export default function GradientText({
  colors,
  locations,
  start,
  end,
  style,
  children,
  ...textProps
}: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <RNText {...textProps} style={style}>
          {children}
        </RNText>
      }
    >
      <LinearGradient
        colors={colors}
        locations={locations}
        start={start}
        end={end}
      >
        {/* Hidden text to size the gradient to the text */}
        <RNText {...textProps} style={[style, { opacity: 0 }]}>
          {children}
        </RNText>
      </LinearGradient>
    </MaskedView>
  );
}

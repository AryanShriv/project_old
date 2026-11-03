import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/context/ThemeContext";
import { fontFamily } from "@/src/design-system/typography";

type AvatarProps = {
  uri?: string;
  name: string;
  size?: number;
  /** Draws the brand-gold ring used for admin-verified experts */
  verified?: boolean;
};

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

/** Profile photo with an initials fallback when there is no photo or it fails to load. */
export const Avatar = ({ uri, name, size = 48, verified = false }: AvatarProps) => {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const ring = verified ? Math.max(2, Math.round(size / 28)) : 0;
  const inner = size - ring * 4;
  const showImage = Boolean(uri) && !failed;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: ring,
        borderColor: verified ? colors.primary : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityLabel={verified ? `${name}, verified expert` : name}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: inner, height: inner, borderRadius: inner / 2 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: colors.primaryMuted },
          ]}
        >
          <Text
            style={{
              fontFamily: fontFamily.displaySemiBold,
              fontSize: Math.round(inner * 0.38),
              color: colors.onPrimaryMuted,
            }}
          >
            {initialsOf(name)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});

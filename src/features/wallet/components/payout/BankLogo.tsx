import React from "react";
import { Image, View } from "@/tw";
import { getThaiBankLogo } from "./thaiBanks";

interface BankLogoProps {
  code: string | null | undefined;
  size?: number;
}

/** Bank mark for a Payout Destination; renders nothing for an unknown code. */
export function BankLogo({ code, size = 32 }: BankLogoProps) {
  const logo = getThaiBankLogo(code);
  if (!logo || !code) return null;
  return (
    <View
      accessibilityElementsHidden
      className="bg-ku-card"
      importantForAccessibility="no-hide-descendants"
      style={{
        alignItems: "center",
        borderRadius: size / 4,
        height: size,
        justifyContent: "center",
        overflow: "hidden",
        width: size,
      }}
      testID={`bank-logo-${code.trim().toUpperCase()}`}
    >
      <Image
        contentFit="contain"
        source={logo}
        style={{ height: size, width: size }}
      />
    </View>
  );
}

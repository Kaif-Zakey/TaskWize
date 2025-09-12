const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Ensure resolver is properly configured
config.resolver = config.resolver || {};

// Add path alias resolution for Metro
config.resolver.alias = {
  "@": path.resolve(__dirname),
  "@/firebase": path.resolve(__dirname, "firebase.ts"),
  "@/components": path.resolve(__dirname, "components"),
  "@/context": path.resolve(__dirname, "context"),
  "@/service": path.resolve(__dirname, "service"),
  "@/types": path.resolve(__dirname, "types"),
};

// Ensure these extensions are recognized
config.resolver.sourceExts = [
  ...(config.resolver.sourceExts || []),
  "ts",
  "tsx",
  "js",
  "jsx",
];

module.exports = withNativeWind(config, { input: "./global.css" });

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add path alias resolution for Metro
config.resolver = config.resolver || {};
config.resolver.alias = {
  "@": path.resolve(__dirname),
  "@/components": path.resolve(__dirname, "components"),
  "@/context": path.resolve(__dirname, "context"),
  "@/service": path.resolve(__dirname, "service"),
  "@/types": path.resolve(__dirname, "types"),
  "@/firebase": path.resolve(__dirname, "firebase.ts"),
};

module.exports = withNativeWind(config, { input: "./global.css" });

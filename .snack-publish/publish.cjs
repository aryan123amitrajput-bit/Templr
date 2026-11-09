const fs = require("node:fs");
const path = require("node:path");
const { Snack } = require("snack-sdk");

async function publish() {
  const root = path.resolve(__dirname, "..");
  const contents = fs.readFileSync(path.join(root, "App.js"), "utf8");

  const snack = new Snack({
    name: "Premium Liquid Glass Button",
    description:
      "An Android-first liquid glass button for Expo Go: native backdrop blur, layered refraction, specular lighting, spring touch feedback, and a graceful translucent fallback.",
    sdkVersion: "55.0.0",
    disabled: true,
    dependencies: {
      "expo-blur": { version: "~55.0.18" },
      "expo-linear-gradient": { version: "~55.0.18" },
      "expo-haptics": { version: "~55.0.18" },
    },
    files: {
      "App.js": { type: "CODE", contents },
      "README.md": {
        type: "CODE",
        contents:
          "# Premium Liquid Glass Button\n\nOpen the Android preview or scan with Expo Go. All dependencies are already configured for Expo SDK 55.\n",
      },
    },
  });

  const result = await snack.saveAsync({ ignoreUser: true });
  const editorUrl = `https://snack.expo.dev/${result.id}?platform=android`;
  const output = { ...result, editorUrl, sdkVersion: "55.0.0" };

  fs.writeFileSync(
    path.join(__dirname, "result.json"),
    JSON.stringify(output, null, 2),
  );
  console.log(`LIQUID_GLASS_SNACK_URL=${editorUrl}`);
  console.log(JSON.stringify(output, null, 2));
}

publish().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);

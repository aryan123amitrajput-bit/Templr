const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const resultPath = path.join(root, "snack-result.json");

async function publish() {
  const contents = fs.readFileSync(path.join(root, "App.js"), "utf8");
  const dependencies = {
    "expo-blur": "~58.0.5",
    "expo-linear-gradient": "~58.0.3",
    "expo-haptics": "~58.0.7",
  };

  const response = await fetch("https://exp.host/--/api/v2/snack/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      manifest: {
        sdkVersion: "58.0.0",
        name: "Premium Liquid Glass Button — SDK 58",
        description:
          "Android liquid glass for Expo Go SDK 58: native backdrop blur, refraction, specular lighting, spring touch feedback, and a graceful fallback.",
        dependencies,
      },
      code: {
        "App.js": { type: "CODE", contents },
        "README.md": {
          type: "CODE",
          contents:
            "# Premium Liquid Glass Button\n\nConfigured for Expo Go SDK 58. Open Run on device and scan the Android QR code. All dependencies are included.\n",
        },
      },
      dependencies: Object.fromEntries(
        Object.entries(dependencies).map(([packageName, version]) => [
          packageName,
          { version },
        ]),
      ),
      isDraft: false,
    }),
  });
  const data = await response.json();

  if (!response.ok || !data.id) {
    throw new Error(
      data?.errors?.[0]?.message ||
        `Expo Snack save failed with HTTP ${response.status}`,
    );
  }

  const output = {
    ok: true,
    id: data.id,
    editorUrl: `https://snack.expo.dev/${data.id}?platform=android`,
    sdkVersion: "58.0.0",
  };
  fs.writeFileSync(resultPath, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

publish().then(
  () => process.exit(0),
  (error) => {
    fs.writeFileSync(
      resultPath,
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    console.error(error);
    process.exit(1);
  },
);

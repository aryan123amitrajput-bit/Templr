const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const resultPath = path.join(root, "snack-result.json");

async function publish() {
  const contents = fs.readFileSync(path.join(root, "App.js"), "utf8");
  const dependencies = {
    "expo-blur": "~55.0.18",
    "expo-linear-gradient": "~55.0.18",
    "expo-haptics": "~55.0.18",
  };
  const name = "Premium Liquid Glass Button";
  const description =
    "An Android-first liquid glass button for Expo Go: native backdrop blur, layered refraction, specular lighting, spring touch feedback, and a graceful translucent fallback.";

  const response = await fetch("https://exp.host/--/api/v2/snack/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      manifest: {
        sdkVersion: "55.0.0",
        name,
        description,
        dependencies,
      },
      code: {
        "App.js": { type: "CODE", contents },
        "README.md": {
          type: "CODE",
          contents:
            "# Premium Liquid Glass Button\n\nOpen the Android preview or scan with Expo Go. All dependencies are already configured for Expo SDK 55.\n",
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

  const editorUrl = `https://snack.expo.dev/${data.id}?platform=android`;
  const output = {
    ok: true,
    id: data.id,
    hashId: data.hashId,
    snackId: data.snackId,
    editorUrl,
    sdkVersion: "55.0.0",
  };

  fs.writeFileSync(resultPath, JSON.stringify(output, null, 2));
  console.log(`LIQUID_GLASS_SNACK_URL=${editorUrl}`);
  console.log(JSON.stringify(output, null, 2));
}

publish().then(
  () => process.exit(0),
  (error) => {
    const output = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    fs.writeFileSync(resultPath, JSON.stringify(output, null, 2));
    console.error(error);
    process.exit(1);
  },
);

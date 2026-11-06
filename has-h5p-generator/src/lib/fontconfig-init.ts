let fontconfigInitialized = false;

export function ensureFontconfig(): void {
  if (fontconfigInitialized) return;
  fontconfigInitialized = true;

  if (typeof window !== "undefined") return;

  try {
    const fs = eval("require")("fs");
    const path = eval("require")("path");

    const cwd = process.cwd();
    const candidateDirs = [
      path.resolve(cwd, "fonts"),
      path.resolve(cwd, "has-h5p-generator", "fonts"),
      "/var/task/fonts",
      "/var/task/has-h5p-generator/fonts",
    ];

    let foundDir = candidateDirs.find((dir: string) => fs.existsSync(dir));
    if (!foundDir) {
      foundDir = path.resolve(cwd, "fonts");
    }

    const confPath = path.join(foundDir, "fonts.conf");
    const cacheDir = path.join("/tmp", "fonts-cache");
    if (!fs.existsSync(cacheDir)) {
      try {
        fs.mkdirSync(cacheDir, { recursive: true });
      } catch {}
    }

    process.env.FONTCONFIG_PATH = foundDir;
    if (fs.existsSync(confPath)) {
      process.env.FONTCONFIG_FILE = confPath;
    }
  } catch (err) {
    console.warn("[ensureFontconfig] Error setting up Fontconfig:", err);
  }
}

ensureFontconfig();

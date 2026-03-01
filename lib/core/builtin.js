import fs from "fs";
import path from "path";
import url from "url";
import yaml from "yaml";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const resourceDir = path.join(__dirname, "../queries");

const SCRIPTS = {};

try {
  const files = fs.readdirSync(resourceDir);
  for (const file of files) {
    if (file.endsWith(".yaml")) {
      const content = fs.readFileSync(path.join(resourceDir, file), "utf8");
      const script = yaml.parse(content);
      if (script && script.name) {
        SCRIPTS[script.name.toUpperCase().replace(/-/g, "_")] = script;
      }
    }
  }
} catch (err) {
  console.error(
    `Failed to load builtin scripts from ${resourceDir}: ${err.message}`,
  );
}

export default SCRIPTS;

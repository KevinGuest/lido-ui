import { rmSync } from "node:fs";
import { join } from "node:path";

// try.lido.wtf / Pages uses output: "export" — no server or public-only dynamic routes.
// Umbrel and lido.wtf Docker builds keep these.
rmSync(join("src", "app", "pool-proxy"), { recursive: true, force: true });
rmSync(join("src", "app", "device"), { recursive: true, force: true });
console.log(
  "prepare-pages-export: removed src/app/pool-proxy and src/app/device for static export",
);

import { rmSync } from "node:fs";
import { join } from "node:path";

// lido.wtf uses output: "export" — no server routes. Umbrel keeps pool-proxy.
rmSync(join("src", "app", "pool-proxy"), { recursive: true, force: true });
console.log("prepare-pages-export: removed src/app/pool-proxy for static export");

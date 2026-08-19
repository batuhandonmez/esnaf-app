import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("npm run db:test:setup", { stdio: "inherit" });
}

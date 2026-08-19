import { execSync } from "node:child_process";

const testDatabaseUrl =
  "postgresql://esnaf:esnaf@localhost:5433/esnaf_test?schema=public";

execSync("npx prisma migrate reset --force", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
});

execSync("npx prisma db seed", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
});

console.log("Test veritabanı hazır.");

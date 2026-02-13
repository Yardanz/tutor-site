const required = [
  "DATABASE_URL",
  "JWT_SECRET",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key}`);
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

import "dotenv/config";

process.env.DATABASE_URL ??=
  "postgresql://postgres:postgres@localhost:5432/tradex?schema=public";

const config = {
  schema: "prisma/schema.prisma",
};

export default config;

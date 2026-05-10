import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [".next/**", ".next-*/**", ".next-codex-build/**", "node_modules/**"],
  },
  ...nextVitals,
];

export default config;

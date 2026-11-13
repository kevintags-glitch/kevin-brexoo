import next from "eslint-config-next";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...next,
  ...nextTs,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "supabase/**", "playwright-report/**", "test-results/**"] },
  {
    rules: {
      // Apostrophes in JSX text render correctly; escaping them only hurts readability.
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
    },
  },
  {
    // Server Components render once per request, so reading the clock there is intended.
    files: ["app/**/page.tsx", "app/**/layout.tsx"],
    rules: { "react-hooks/purity": "off" },
  },
];

export default config;

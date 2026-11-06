import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "public/h5p-libs/**",
      "public/preview-h5p/**",
      "public/preview-viewer/**",
      "public/preview-viewer-standalone/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "warn",
      "no-console": "off",
    },
  },
];

export default eslintConfig;

import tseslint from "@typescript-eslint/eslint-plugin";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  {
    files: ["**/*.{ts,cts,mts}"],
    plugins: { "@typescript-eslint": tseslint },
    extends: [
      "plugin:@typescript-eslint/recommended",
      "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ],
    parserOptions: {
      project: "./tsconfig.json", // must point to tsconfig.json that includes your files
      tsconfigRootDir: process.cwd(),
      ecmaVersion: "latest",
      sourceType: "module",
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/typedef": [
        "error",
        {
          arrayDestructuring: true,
          arrowParameter: true,
          memberVariableDeclaration: true,
          objectDestructuring: true,
          parameter: true, // <-- catch function parameters
          propertyDeclaration: true,
          variableDeclaration: true,
          variableDeclarationIgnoreFunction: false,
        },
      ],

      "@typescript-eslint/no-unused-vars": "warn",

      "@typescript-eslint/no-implicit-any-catch": "error",

      "@typescript-eslint/strict-boolean-expressions": "error",
    },
  },
]);

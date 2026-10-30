import eslint from "@eslint/js";
import pStylistic from "@stylistic/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import pImport from "eslint-plugin-import";
import pJson from "eslint-plugin-json";
import globals from "globals";
import tsEslint from "typescript-eslint";


const tsFilePatterns = ["**/*.{ts,tsx}"];

export default defineConfig([
  globalIgnores([
    "**/.tests/**",
    "**/build/**",
    "**/dist/**",
    "**/node_modules/**/*",
    "**/out/**",
    "**/wasm/**/*",
    "**/package-lock.json"
  ]),

  {
    files: tsFilePatterns,
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    }
  },
  {
    settings: {
      "import/resolver": {
        typescript: {
          extensions: [".ts", ".tsx"]
        }
      }
    }
  },

  eslint.configs.recommended,
  ...tsEslint.configs.strictTypeChecked.map(cfg => ({
    ...cfg,
    files: tsFilePatterns
  })),
  ...tsEslint.configs.stylisticTypeChecked.map(cfg => ({
    ...cfg,
    files: tsFilePatterns
  })),
  pStylistic.configs.recommended,
  pImport.flatConfigs.recommended,

  // JSON
  {
    ...pJson.configs["recommended-with-comments"],

    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { extraFileExtensions: [".json"], projectService: true, sourceType: "module" }
    },

    rules: {
      "json/undefined": "error",
      "json/enum-value-mismatch": "error",
      "json/unexpected-end-of-comment": "error",
      "json/unexpected-end-of-string": "error",
      "json/unexpected-end-of-number": "error",
      "json/invalid-unicode": "error",
      "json/invalid-escape-character": "error",
      "json/invalid-character": "error",
      "json/property-expected": "error",
      "json/comma-expected": "error",
      "json/colon-expected": "error",
      "json/value-expected": "error",
      "json/comma-or-close-backet-expected": "error",
      "json/comma-or-close-brace-expected": "error",
      "json/trailing-comma": "error",
      "json/duplicate-key": "error",
      "json/comment-not-permitted": "error",
      "json/schema-resolve-error": "error",
      "json/unknown": "error"
    }
  },

  // IMPORT
  {
    rules: {
      "import/named": "off",
      "import/newline-after-import": ["error", { count: 2 }],
      "import/no-default-export": "off",
      "import/no-unresolved": ["error", { caseSensitiveStrict: true, ignore: ["globals"] }],
      "import/no-self-import": "error",
      "import/no-duplicates": "error",
      "import/namespace": "off",
      "import/order": ["error", {
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true },
        "groups": ["builtin", "external", "internal", ["parent", "sibling", "index", "object"], "type", "unknown"],
        "pathGroups": [
          { pattern: "**/*.+(css|sass|less|scss|pcss|styl|woff)", patternOptions: { dot: true, nocomment: true }, group: "unknown", position: "after" },
          { pattern: "{.,..}/**/*.+(css|sass|less|scss|pcss|styl|woff)", patternOptions: { dot: true, nocomment: true }, group: "unknown", position: "after" }
        ],
        "warnOnUnassignedImports": true
      }]
    }
  },

  // STYLE
  {
    rules: {
      "eqeqeq": "error",
      "prefer-const": "error",
      "no-empty": "error",
      "no-cond-assign": "error",
      "no-debugger": "warn",
      "no-empty-function": "off",
      "no-unused-vars": "off",
      "@stylistic/curly-newline": ["error", { "consistent": true }],
      "@stylistic/brace-style": ["error", "stroustrup", { "allowSingleLine": true }],
      "@stylistic/block-spacing": "error",
      "@stylistic/indent-binary-ops": ["error", 2],
      "@stylistic/arrow-parens": ["error", "as-needed"],
      "@stylistic/no-extra-parens": "error",
      "@stylistic/no-multi-spaces": "error",
      "@stylistic/operator-linebreak": ["error", "before", { "overrides": { "=": "after" } }],
      "@stylistic/linebreak-style": "off",
      "@stylistic/semi": ["error", "always"],
      "@stylistic/no-extra-semi": "error",
      "@stylistic/no-mixed-spaces-and-tabs": "error",
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/max-statements-per-line": "off",
      "@stylistic/quotes": ["error", "double", { "allowTemplateLiterals": "always" }],
      "@stylistic/quote-props": ["error", "consistent"],
      "@stylistic/multiline-ternary": ["error", "always-multiline"],
      "@stylistic/no-multiple-empty-lines": ["error", { max: 2, maxBOF: 0 }],
      "@stylistic/no-tabs": "off",
      "@stylistic/comma-dangle": ["error", "never"],
      "@stylistic/jsx-indent-props": ["error", 2],
      "@stylistic/indent": ["error", 2, { "SwitchCase": 1, "flatTernaryExpressions": true }],
      "@stylistic/type-generic-spacing": ["error"],
      "@stylistic/type-named-tuple-spacing": ["error"],
      "@stylistic/nonblock-statement-body-position": ["error", "beside"],
      "@stylistic/no-whitespace-before-property": "error",
      "@stylistic/member-delimiter-style": [
        "error", {
          "multiline": {
            "delimiter": "semi",
            "requireLast": true
          },
          "singleline": {
            "delimiter": "semi",
            "requireLast": true
          },
          "overrides": {
            "interface": {
              "multiline": {
                "delimiter": "semi",
                "requireLast": true
              }
            }
          }
        }
      ]
    }
  },

  // TYPESCRIPT
  {
    files: tsFilePatterns,

    rules: {
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-unsafe-declaration-merging": "error",
      "@typescript-eslint/no-unsafe-enum-comparison": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { vars: "all", varsIgnorePattern: "^_", argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_", args: "after-used" }],
      "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true, allowTypedFunctionExpressions: true }],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowBoolean: true,
          allowNever: false,
          allowNullish: true,
          allowNumber: true,
          allowRegExp: false
        }
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", disallowTypeAnnotations: false }],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"] },
        { selector: "variable", modifiers: ["exported"], filter: { regex: "^use", match: true }, format: ["camelCase"] },
        { selector: "variable", modifiers: ["global"], filter: { regex: "^use", match: true }, format: ["camelCase"] },
        { selector: "variable", modifiers: ["global"], format: ["PascalCase"] },
        { selector: "variable", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "function", modifiers: ["exported"], filter: { regex: "^use", match: true }, format: ["camelCase"] },
        { selector: "function", modifiers: ["global"], filter: { regex: "^use", match: true }, format: ["camelCase"] },
        { selector: "function", modifiers: ["global"], format: ["PascalCase"] },
        { selector: "function", format: ["camelCase"] },
        { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "parameter", format: ["PascalCase"], filter: { regex: "Icon", match: true } },
        { selector: "property", format: null },
        { selector: "classProperty", types: ["number"], format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "method", format: ["camelCase"] },
        { selector: "enumMember", format: ["PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "import", format: null }
      ]
    }
  }
]);

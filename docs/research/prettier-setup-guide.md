# Prettier setup guide for KUQUest Mobile

**Research date:** 2026-09-19  
**Scope:** This repository's Expo SDK 57, React Native 0.86, React 19, NativeWind 5 preview/Tailwind CSS 4, TypeScript 6, ESLint 9 flat-config, Bun, Husky, and lint-staged toolchain.

## How to read this report

- **Source requirement** means behavior stated by a first-party project source.
- **Repo observation** records the current repository without changing it.
- **Recommendation** is the concrete setup proposed for this repository.
- **Conditional action** is unnecessary now and applies only if the stated condition later becomes true.

## Primary Sources

- Expo: [Using ESLint and Prettier](https://docs.expo.dev/guides/using-eslint/)
- Prettier: [Configuration](https://prettier.io/docs/configuration), [Options](https://prettier.io/docs/options), [CLI](https://prettier.io/docs/cli), [Ignoring Code](https://prettier.io/docs/ignore), [Integrating with Linters](https://prettier.io/docs/integrating-with-linters), and [Pre-commit Hook](https://prettier.io/docs/precommit)
- Tailwind Labs: [`prettier-plugin-tailwindcss` README](https://github.com/tailwindlabs/prettier-plugin-tailwindcss), [package metadata](https://github.com/tailwindlabs/prettier-plugin-tailwindcss/blob/main/package.json), and [plugin options](https://github.com/tailwindlabs/prettier-plugin-tailwindcss/blob/main/src/options.ts)
- NativeWind: [NativeWind v5 installation](https://www.nativewind.dev/v5/getting-started/installation)
- ESLint: [formatting-rule guidance](https://eslint.org/docs/latest/use/core-concepts/glossary#formatting-rule) and [flat configuration files](https://eslint.org/docs/latest/use/configure/configuration-files)
- Expo source: [`eslint-config-expo/flat`](https://github.com/expo/expo/blob/main/packages/eslint-config-expo/flat/default.js)
- Prettier source: [`eslint-config-prettier` flat-config setup](https://github.com/prettier/eslint-config-prettier#eslintconfigjs-flat-config)

## Current Baseline

- **Repo observation:** [`package.json`](../../package.json) pins Expo `~57.0.9`, React Native `0.86.2`, React `19.2.3`, NativeWind `5.0.0-preview.2`, Tailwind CSS `^4`, TypeScript `~6.0.3`, ESLint `^9.0.0`, `eslint-config-expo` `~57.0.1`, Prettier `^3.9.6`, Husky `^9.1.7`, and lint-staged `^17.4.1`. `prettier-plugin-tailwindcss`, `eslint-config-prettier`, and `eslint-plugin-prettier` are not installed.
- **Repo observation:** [`.prettierrc`](../../.prettierrc) is valid JSON and sets two-space indentation, an 80-column target, double quotes, ES5 trailing commas, semicolons, and parentheses around arrow-function parameters. It does not configure Tailwind class sorting.
- **Repo observation:** There is no `.prettierignore`. The `format` and `format:check` scripts only cover `src/**/*.{ts,tsx}`, so they omit `src/global.css`, JSON, JavaScript/config files, Markdown, and other Prettier-supported files.
- **Repo observation:** [`.lintstagedrc`](../../.lintstagedrc) sends every staged path to `prettier --ignore-unknown --write`. [`.husky/pre-commit`](../../.husky/pre-commit) runs lint-staged first, then type checking and tests. This is already the architecture documented by Prettier for formatting staged files ([Pre-commit Hook](https://prettier.io/docs/precommit)).
- **Repo observation:** [`eslint.config.js`](../../eslint.config.js) loads `eslint-config-expo/flat` and adds a `dist/*` ignore. The installed Expo 57 config enables correctness, React, hooks, imports, and TypeScript rules, but no indentation, quote, semicolon, or whitespace policy. Expo has used flat config by default since SDK 53 ([Expo ESLint setup](https://docs.expo.dev/guides/using-eslint/#setup)); ESLint defines flat config as an ordered array in which later entries can override earlier entries ([ESLint configuration files](https://eslint.org/docs/latest/use/configure/configuration-files)).
- **Repo observation:** Tailwind CSS 4 is configured through [`src/global.css`](../../src/global.css) and [`postcss.config.mjs`](../../postcss.config.mjs). JSX uses standard `className` plus the custom `contentContainerClassName`, `contentClassName`, and `imageClassName` props. [`src/tw/cn.ts`](../../src/tw/cn.ts) provides the frequently used `cn()` helper and delegates to `clsx` and `tailwind-merge`.

## Recommendations

### 1. Keep one repository-local Prettier configuration

**Source requirement:** Prettier resolves configuration from the formatted file upward, supports JSON `.prettierrc`, and intentionally has no global configuration so a checkout formats consistently on every machine ([Configuration](https://prettier.io/docs/configuration)). Formatting options belong in the configuration file rather than repeated CLI flags so the CLI, editors, and other tooling share them ([CLI](https://prettier.io/docs/cli), [Options](https://prettier.io/docs/options)).

**Recommendation:** Keep the root JSON `.prettierrc`. Preserve the existing style choices to avoid an unrelated repository-wide style migration, and add only the Tailwind plugin settings required by this codebase ([Prettier configuration](https://prettier.io/docs/configuration), [`prettier-plugin-tailwindcss` installation](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#installation)). The current `printWidth: 80` is a wrapping target, not a hard maximum; do not pair it with an ESLint `max-len` formatting policy ([Prettier print width](https://prettier.io/docs/options#print-width)).

Several existing values happen to match Prettier defaults, but retaining them makes the established project style explicit and avoids treating a future Prettier default change as a team decision. No parser should be set globally: Prettier warns that doing so disables extension-based parser inference for all file types ([Setting the parser option](https://prettier.io/docs/configuration#setting-the-parser-option)).

### 2. Add Tailwind CSS 4-aware class sorting

**Source requirement:** The Tailwind Labs plugin supports Prettier 3 and Tailwind CSS 3+, and its current package declares the Prettier peer range `^3.0` ([plugin README](https://github.com/tailwindlabs/prettier-plugin-tailwindcss), [package metadata](https://github.com/tailwindlabs/prettier-plugin-tailwindcss/blob/main/package.json)). NativeWind's v5 guide lists `prettier-plugin-tailwindcss` as the optional formatter for its Tailwind CSS 4 setup ([NativeWind v5 installation](https://www.nativewind.dev/v5/getting-started/installation#2-setup-tailwind-css)).

**Recommendation:** Add `prettier-plugin-tailwindcss` as a dev dependency. For Tailwind CSS 4, set `tailwindStylesheet` to `./src/global.css`; Tailwind Labs says the v4 stylesheet entry point is required so the sorter sees the project's theme, custom utilities, and other CSS configuration, and resolves the path relative to the Prettier config ([Tailwind CSS v4 stylesheet option](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#specifying-your-tailwind-stylesheet-path-tailwind-css-v4)). Do not add the v3-only `tailwindConfig` option.

`className` needs no special entry because the plugin recognizes it by default. Add the repository's nonstandard class-bearing props to `tailwindAttributes`, and add `cn` and `clsx` to `tailwindFunctions` so literal class lists passed through those helpers are sorted ([sorting nonstandard attributes](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#sorting-non-standard-attributes), [sorting function calls](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#sorting-classes-in-function-calls)). Do not list `twMerge`: the current direct call only receives the result of `clsx`, not class-string literals.

If another Prettier plugin is added later, keep `prettier-plugin-tailwindcss` last; Tailwind Labs documents this ordering requirement for supported plugin interoperation ([plugin compatibility](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#compatibility-with-other-prettier-plugins)).

### 3. Keep formatting separate from ESLint

**Source requirement:** ESLint no longer recommends formatting rules and recommends a dedicated formatter such as Prettier instead ([ESLint formatting rules](https://eslint.org/docs/latest/use/core-concepts/glossary#formatting-rule)). Prettier likewise recommends using Prettier for formatting and a linter for code quality ([Integrating with Linters](https://prettier.io/docs/integrating-with-linters)).

**Recommendation:** Keep `bun run lint` and `bun run format:check` as separate checks. Do not add `eslint-plugin-prettier`: although Expo's general integration example shows it, Prettier's own guidance says running Prettier as an ESLint rule is generally not recommended because it is slower, adds indirection, and produces noisy editor diagnostics; direct `prettier --check .` is the preferred check ([Expo integration example](https://docs.expo.dev/guides/using-eslint/#prettier), [Prettier linter integration notes](https://prettier.io/docs/integrating-with-linters#notes)).

**Recommendation:** Do not add `eslint-config-prettier` to the current dependency set. The installed `eslint-config-expo/flat` rules do not currently impose a competing formatter policy, so a package whose only job is disabling such rules would have no present work to do. This follows the separation ESLint and Prettier recommend rather than adding a defensive dependency without an active conflict ([ESLint formatting rules](https://eslint.org/docs/latest/use/core-concepts/glossary#formatting-rule), [Prettier linter integration](https://prettier.io/docs/integrating-with-linters)).

**Conditional action:** If a future ESLint shareable config introduces formatting/stylistic rules, install `eslint-config-prettier`, import `eslint-config-prettier/flat`, and place it after the configs whose conflicting rules it must disable. Flat configs are applied in array order, and the package's first-party instructions require the Prettier config after the configs it overrides ([ESLint configuration arrays](https://eslint.org/docs/latest/use/configure/configuration-files), [`eslint-config-prettier` flat setup](https://github.com/prettier/eslint-config-prettier#eslintconfigjs-flat-config)). Run its CLI helper against representative JS/TS/TSX files before keeping the dependency ([CLI helper](https://github.com/prettier/eslint-config-prettier#cli-helper-tool)).

### 4. Add an explicit `.prettierignore`

**Source requirement:** Prettier recommends a root `.prettierignore`, uses gitignore syntax, always ignores VCS directories and `node_modules`, and also follows the `.gitignore` found in the directory from which it runs ([Ignoring files](https://prettier.io/docs/ignore#ignoring-files-prettierignore)). The CLI recommends confirming that `prettier --write .` only reaches intended files and using `.prettierignore` for generated or otherwise non-formatable content ([CLI](https://prettier.io/docs/cli)).

**Recommendation:** Add the explicit ignore file below. Some entries duplicate [`.gitignore`](../../.gitignore) intentionally: `.prettierignore` states the formatter boundary to editors and other Prettier integrations, while protecting generated native projects, build outputs, coverage, generated declarations, and package-manager lockfiles from rewrite ([Ignoring files](https://prettier.io/docs/ignore#ignoring-files-prettierignore)).

Do not ignore `src/global.css`, `package.json`, source SVG/config files, or `docs/`; these are authored inputs and should be covered when Prettier supports their file type. Unsupported files are naturally skipped when a directory is passed, and `--ignore-unknown` is available when a broad staged-file matcher can supply unknown extensions ([CLI file patterns](https://prettier.io/docs/cli#file-patterns), [`--ignore-unknown`](https://prettier.io/docs/cli#--ignore-unknown)).

### 5. Make scripts cover the repository and retain staged formatting

**Recommendation:** Change both scripts from a TS/TSX-only glob to `prettier --write .` and `prettier --check .`. Prettier documents directory traversal over supported files, recommends quoted globs when globs are needed, and gives `--check` a nonzero exit status for unformatted files, making it suitable for CI ([CLI file patterns](https://prettier.io/docs/cli#file-patterns), [`--check`](https://prettier.io/docs/cli#--check)). Using `.` also removes the need to maintain an extension list as the repository adds CSS, JSON, Markdown, or config files.

**Recommendation:** Keep [`.lintstagedrc`](../../.lintstagedrc) as `"*": "prettier --ignore-unknown --write"`. The broad matcher lets Prettier format every supported staged file, while `--ignore-unknown` safely skips images, binaries, and other unsupported paths; Prettier explicitly documents lint-staged as its pre-commit option when other code-quality tools or partially staged files are involved ([`--ignore-unknown`](https://prettier.io/docs/cli#--ignore-unknown), [Pre-commit Hook](https://prettier.io/docs/precommit#option-1-lint-staged)).

**Recommendation:** Keep lint-staged before type checking and tests in the Husky hook so checks see the formatted working tree. Do not run all-repository `prettier --write .` from the hook: Prettier's pre-commit guidance is specifically to format staged files, avoiding unrelated rewrites on every commit ([Pre-commit Hook](https://prettier.io/docs/precommit)).

## Concrete Actions

### 1. Add one dev dependency

Use the repository's Bun package-manager convention:

```sh
bun add --dev prettier-plugin-tailwindcss@^0.8.1
```

Version `0.8.1` is the current first-party package version at the research date; it is ESM, declares Prettier `^3.0`, and therefore matches the repository's Prettier 3 line ([package metadata](https://github.com/tailwindlabs/prettier-plugin-tailwindcss/blob/main/package.json)). No Prettier, ESLint, `eslint-config-prettier`, or `eslint-plugin-prettier` update/addition is required for this setup ([Prettier linter integration](https://prettier.io/docs/integrating-with-linters)).

### 2. Replace `.prettierrc` with this configuration

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/global.css",
  "tailwindAttributes": [
    "contentClassName",
    "contentContainerClassName",
    "imageClassName"
  ],
  "tailwindFunctions": ["clsx", "cn"]
}
```

This is a supported JSON configuration; the standard options come from Prettier, while the four `tailwind*`/plugin fields come from Tailwind Labs ([Prettier configuration](https://prettier.io/docs/configuration), [Prettier options](https://prettier.io/docs/options), [Tailwind plugin options](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#options)).

### 3. Create `.prettierignore`

```gitignore
# Dependencies and tool caches
node_modules/
.expo/
.gradle/
.gradle-local-check/
.kotlin/

# Build and test output
dist/
web-build/
coverage/

# Expo prebuild output; generated in this repository
android/
ios/

# Generated declarations
expo-env.d.ts
nativewind-env.d.ts

# Package-manager generated files
bun.lock
package-lock.json
pnpm-lock.yaml
yarn.lock
```

The file uses the gitignore syntax required by Prettier and makes generated/output boundaries explicit ([Ignoring files](https://prettier.io/docs/ignore#ignoring-files-prettierignore)). Lockfiles remain committed inputs to dependency installation; ignoring them here only prevents a formatter from rewriting package-manager-owned serialization.

### 4. Update the two `package.json` scripts

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

Prettier documents these directory-wide `--write` and `--check` forms, with `.prettierignore` defining exclusions ([CLI](https://prettier.io/docs/cli), [Ignoring files](https://prettier.io/docs/ignore)). Keep the existing `verify` composition so formatting remains a distinct check rather than an ESLint rule.

### 5. Leave these integrations unchanged

`.lintstagedrc`:

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

`.husky/pre-commit`:

```sh
bunx lint-staged
bun run typecheck
bun run test
```

`eslint.config.js`: no Prettier-related import or rule is needed under the current Expo config. These decisions keep staged formatting in the documented pre-commit path and formatting out of ESLint ([Prettier Pre-commit Hook](https://prettier.io/docs/precommit), [Prettier linter integration](https://prettier.io/docs/integrating-with-linters), [ESLint formatting rules](https://eslint.org/docs/latest/use/core-concepts/glossary#formatting-rule)).

## Rollout and verification

1. Add the plugin and commit the resulting `package.json` and `bun.lock` change; the plugin must be locally installed for CLI/editor consistency ([plugin installation](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#installation)).
2. Add `.prettierignore`, update `.prettierrc`, and expand the scripts as shown above. Prettier recommends reviewing the reach of `prettier --write .` before adopting it ([CLI](https://prettier.io/docs/cli)).
3. Run `bun run format` once as a deliberate formatting migration and review the diff, especially class order in `className`, the three custom class attributes, and `cn()`/`clsx()` calls. Tailwind Labs documents those exact attribute/function extension points ([attribute sorting](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#sorting-non-standard-attributes), [function sorting](https://github.com/tailwindlabs/prettier-plugin-tailwindcss#sorting-classes-in-function-calls)).
4. Run `bun run format:check`; Prettier returns exit code `0` when all matched files are formatted and `1` when formatting differs ([CLI exit codes](https://prettier.io/docs/cli#exit-codes)).
5. Stage a supported text file and an unsupported asset together, then run `bunx lint-staged` to confirm the supported file formats and the asset is skipped by `--ignore-unknown` ([`--ignore-unknown`](https://prettier.io/docs/cli#--ignore-unknown), [Pre-commit Hook](https://prettier.io/docs/precommit#option-1-lint-staged)).

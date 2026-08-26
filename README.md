# ui-lib

Shared React and Tailwind CSS components for dprb-work products.

The library starts with controls proven in OLAF's visual builder and feedback surfaces extracted from Archmap. It deliberately excludes product navigation, review streams, function cards, diff renderers, graph editors, and domain-specific field composition.

## Components

- `Button` and `IconButton`
- `Checkbox` and `Switch`
- `TextInput`, `NumberInput`, and `SelectInput`
- `Badge`
- `StatusPanel`

## Use

Install the package, then import its stylesheet once at the application entry point:

```tsx
import "@dprb-work/ui-lib/styles.css";

import { Button, Checkbox } from "@dprb-work/ui-lib";
```

Consumers may override the semantic CSS variables `--ui-accent`, `--ui-accent-hover`, `--ui-on-accent`, `--ui-danger`, `--ui-danger-hover`, and `--ui-on-danger` at their application root. The package does not ship Tailwind Preflight.

## Develop

```bash
corepack pnpm install
corepack pnpm run dev
```

Storybook is the component catalog and browser verification surface.

## Verify

```bash
corepack pnpm run verify
corepack pnpm run build
```

`verify` runs ESLint, strict TypeScript, unit tests, browser-backed Storybook tests, and the library build.

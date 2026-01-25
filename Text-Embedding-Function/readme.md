Below is a clean, modern, no-framework setup for Vite + TypeScript + ESLint, suitable for libraries or plain TS projects.
I’ll show:

Project creation
ESLint setup (TypeScript-aware, modern)
Vite + TS wiring
Optional quality upgrades
1️⃣ Create a Vite + TypeScript project (no framework)
npm create vite@latest my-project -- --template vanilla-ts
cd my-project
npm install
This gives you:
Vite
TypeScript
Zero framework
2️⃣ Install ESLint (modern setup)
npm install -D eslint @eslint/js \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-config-prettier
3️⃣ Create ESLint config (Flat config – recommended)
Create eslint.config.js (Vite now supports this well):
import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  }
]
✅ This avoids .eslintrc, which ESLint is moving away from.
4️⃣ Update TypeScript config
Edit tsconfig.json:
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src", "vite.config.ts"]
}
5️⃣ Ensure Vite config is TypeScript-friendly
vite.config.ts:
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: true
  }
})
If you use Node APIs (like path), install Node types:
npm install -D @types/node
And add to tsconfig.json:
"types": ["node"]
6️⃣ Add ESLint scripts
Edit package.json:
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix"
  }
}
Run:
npm run lint
7️⃣ Example source file
src/main.ts:
export function sum(a: number, b: number): number {
  return a + b
}
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

const reactHooksFlat = reactHooks.configs.flat['recommended-latest'];
const reactRefreshFlat = reactRefresh.configs.vite;
const refreshPlugins = reactRefreshFlat.plugins ?? {};

const plugins = {
  'react-hooks': reactHooks,
  ...refreshPlugins,
};

const rules = {
  ...reactHooksFlat.rules,
  ...reactRefreshFlat.rules,
  'react-hooks/set-state-in-effect': 'off',
};

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins,
    rules,
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);

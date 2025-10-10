import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

const reactHooksFlat = reactHooks.configs['recommended-latest'];
const reactRefreshFlat = reactRefresh.configs.vite;

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      ...reactHooksFlat.plugins,
      ...reactRefreshFlat.plugins,
    },
    rules: {
      ...reactHooksFlat.rules,
      ...reactRefreshFlat.rules,
    },
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);

// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'src/lib/database.types.ts'],
  },
  {
    rules: {
      // Screens currently load data inside useEffect. This is replaced by
      // shared data hooks in roadmap step 0.5; until then only warn.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);

// L'outil de qualite de code : ESLint, avec les regles recommandees pour TypeScript.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': ['warn', { allow: ['log', 'error'] }],
    },
  },
);

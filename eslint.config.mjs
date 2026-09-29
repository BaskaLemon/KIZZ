import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['*.config.js', '.next/**', 'coverage/**', 'next-env.d.ts', '.kilo/**'],
  },
  {
    // Test scripts poke at loosely-typed JSON responses.
    files: ['scripts/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    // Avatars are inline DiceBear data URIs and local logos, so next/image's
    // optimization gives nothing here.
    rules: { '@next/next/no-img-element': 'off' },
  },
];

export default config;

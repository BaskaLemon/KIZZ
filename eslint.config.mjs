import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['*.config.js', '.next/**', 'coverage/**', 'next-env.d.ts', '.kilo/**'],
  },
  {
    // Avatars are inline DiceBear data URIs and local logos, so next/image's
    // optimization gives nothing here.
    rules: { '@next/next/no-img-element': 'off' },
  },
];

export default config;

// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

// The above utility import will not work if you are using Next.js' --turbo.
// Instead you will have to manually add the dependent paths to be included.
// For example
// ../libs/buttons/**/*.{ts,tsx,js,jsx,html}',                 <--- Adding a shared lib
// !../libs/buttons/**/*.{stories,spec}.{ts,tsx,js,jsx,html}', <--- Skip adding spec/stories files from shared lib

// If you are **not** using `--turbo` you can uncomment both lines 1 & 19.
// A discussion of the issue can be found: https://github.com/nrwl/nx/issues/26510

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
    //     ...createGlobPatternsForDependencies(__dirname)
  ],
  theme: {
    extend: {
      colors: {
        paper: 'var(--color-paper)',
        'paper-raised': 'var(--color-paper-raised)',
        ink: 'var(--color-ink)',
        'ink-soft': 'var(--color-ink-soft)',
        line: 'var(--color-line)',

        violet: 'var(--color-violet)',
        mint: 'var(--color-mint)',
        coral: 'var(--color-coral)',
        amber: 'var(--color-amber)',
        'bold-quiz': 'var(--color-bold-quiz)',

        stage: 'var(--color-stage)',
        'stage-raised': 'var(--color-stage-raised)',
        'stage-text': 'var(--color-stage-text)',
        'stage-text-soft': 'var(--color-stage-text-soft)',

        'rail-bg': 'var(--color-rail-bg)',
        'rail-active-bg': 'var(--color-rail-active-bg)',
        'rail-icon': 'var(--color-rail-icon)',
        'rail-icon-active': 'var(--color-rail-icon-active)',

        'answer-1': 'var(--color-answer-1)',
        'answer-2': 'var(--color-answer-2)',
        'answer-3': 'var(--color-answer-3)',
        'answer-4': 'var(--color-answer-4)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      spacing: {
        '0.75': '0.1875rem',
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '7.5': '1.875rem',
        '8.5': '2.125rem',
        '10.5': '2.625rem',
        13: '3.25rem',
        15: '3.75rem',
        21: '5.25rem',
        30: '7.5rem',
        155: '38.75rem',
        170: '42.5rem',
        225: '56.25rem',
        270: '67.5rem',
      },
      borderWidth: {
        3: '3px',
        5: '5px',
      },
      boxShadow: {
        'pop-sm': '3px 3px 0 0 var(--color-ink)',
        'pop-md': '5px 5px 0 0 var(--color-ink)',
        'pop-violet': '5px 5px 0 0 var(--color-violet)',
      },
    },
  },
  plugins: [],
};

import i18next from 'eslint-plugin-i18next'

export default [
  {
    plugins: {
      i18next,
    },
    rules: {
      'i18next/no-literal-string': [
        'warn',
        {
          markupOnly: true,
          ignoreAttribute: [
            'data-testid',
            'className',
            'href',
            'target',
            'rel',
            'aria-label',
            'name',
            'type',
            'variant',
            'textStyle',
            'as',
            'value',
            'key',
            'id',
            'layoutId',
            'src',
            'alt',
            'colorPalette',
            'size',
            'borderColor',
            'bg',
            'color',
            'dataKey',
            'unit',
          ],
        },
      ],
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'build/**', '*.config.js', '*.config.ts'],
  },
]

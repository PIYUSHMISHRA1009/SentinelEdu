module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'src/app/**',
    'src/features/**',
    'src/mocks/**',
    'src/tests/**',
    'src/api/axiosClient.ts',
    'src/api/types.ts',
    'src/components/Header.tsx',
    'src/components/Layout.tsx',
    'src/components/Sidebar.tsx',
    'src/components/ThemeProvider.tsx',
    'src/components/ToastProvider.tsx',
    'src/components/ui/index.ts'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}

// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'out-tsc/**', '.angular/**', 'storybook-static/**', '**/*.generated.ts'],
  },
  {
    files: ['**/*.ts', '**/*.mts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // output<void>() is the idiomatic Angular event without payload.
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/no-host-metadata-property': 'off',
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['primeng', 'primeng/*', '@angular/material', '@angular/material/*'],
              message:
                'The project uses @vplans/ui-kit instead of third-party component libraries.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Decorator[expression.callee.name=/^(HostBinding|HostListener|Input|Output|ViewChild|ViewChildren|ContentChild|ContentChildren)$/]',
          message:
            'Use host metadata and signal APIs (input, output, model, viewChild, contentChild).',
        },
        {
          selector: 'Decorator[expression.callee.name="NgModule"]',
          message: 'Standalone components only.',
        },
      ],
    },
  },
  {
    // Type-aware rules that catch bugs (not the whole strictTypeChecked set).
    files: ['projects/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: [
          './projects/ui-kit/tsconfig.lib.json',
          './projects/ui-kit/tsconfig.spec.json',
          './projects/ui-kit/.storybook/tsconfig.json',
          './projects/playground/tsconfig.app.json',
          './projects/playground/tsconfig.spec.json',
        ],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-deprecated': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['projects/ui-kit/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'ui', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'ui', style: 'camelCase' },
      ],
    },
  },
  {
    files: ['projects/playground/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.stories.ts'],
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      // The CDK key managers read the legacy keyCode, so test events must set it.
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },
);

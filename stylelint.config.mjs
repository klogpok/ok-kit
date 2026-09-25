/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['dist/**', '**/tokens.css', '**/_tokens.scss', 'node_modules/**'],
  rules: {
    'declaration-no-important': true,
    'selector-pseudo-element-no-unknown': [true, { ignorePseudoElements: [] }],
    'selector-pseudo-element-disallowed-list': ['ng-deep'],
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['host', 'host-context'] }],
    'selector-type-no-unknown': [true, { ignoreTypes: ['/^ui-/', '/^app-/'] }],
    'custom-property-pattern': ['^(_|ui-)[a-z0-9-]*$', { message: 'Use --ui-* tokens or --_private component variables' }],
    'keyframes-name-pattern': '^ui-[a-z0-9-]+$',
    'scss/dollar-variable-pattern': null,
    'scss/at-mixin-pattern': null,
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'declaration-empty-line-before': null,
    'scss/double-slash-comment-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'at-rule-empty-line-before': ['always', { except: ['blockless-after-same-name-blockless', 'first-nested'], ignore: ['after-comment'], ignoreAtRules: ['include', 'else', 'use', 'forward'] }],
  },
  overrides: [
    {
      // Components: tokens only. No raw colors or absolute sizes.
      files: ['projects/ui-kit/**/*.scss'],
      rules: {
        'color-no-hex': true,
        'color-named': 'never',
        'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'oklch', 'lab', 'lch'],
        'unit-disallowed-list': [['px', 'rem', 'pt'], { ignoreProperties: { px: [] } }],
        'declaration-property-value-disallowed-list': {
          '/^(z-index|transition-duration|animation-duration)$/': ['/^[1-9]/'],
          // Logical values (start/end) mirror in RTL; physical ones do not.
          'text-align': ['left', 'right'],
        },
        'property-disallowed-list': ['margin-left', 'margin-right', 'padding-left', 'padding-right', 'left', 'right', 'border-left', 'border-right'],
      },
    },
  ],
};

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./eslint-base')],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    'no-process-env': 'off',
  },
};

module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  ignorePatterns: ["**/lib/*.js"],
  rules: {
    '@typescript-eslint/no-explicit-any': 0
  }
};

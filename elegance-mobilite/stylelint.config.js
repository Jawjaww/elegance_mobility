module.exports = {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-tailwindcss",
  ],
  plugins: [
    "stylelint-order",
  ],
  rules: {
    "at-rule-no-unknown": null,
    "no-descending-specificity": null,
    "function-no-unknown": [
      true,
      {
        ignoreFunctions: ["theme"]
      }
    ],
    "tailwindcss/no-custom-classname": null
  },
};
import css from "rollup-plugin-import-css";

/**
 * Replaces all absolute asset paths with relative ones to preserve compatibility with route prefixing.
 * @param {string} code
 * @returns {string}
 */
function replaceAbsolutePaths(code) {
  return code.replaceAll("/systems/hollows-rpg/", "../");
}

export default [{
  input: "./hollows-rpg.mjs",
  output: {
    file: "./public/hollows-rpg.mjs",
    format: "esm",
    sourcemap: true,
  },
}, {
  input: "./code/styles/system/_system.mjs",
  output: {
    file: "./public/css/hollows-rpg-system.mjs",
    format: "esm",
    assetFileNames: "hollows-rpg-system.css",
  },
  plugins: [css({
    transform: replaceAbsolutePaths,
  })],
}, {
  input: "./code/styles/variables/_variables.mjs",
  output: {
    file: "./public/css/hollows-rpg-variables.mjs",
    format: "esm",
    assetFileNames: "hollows-rpg-variables.css",
  },
  plugins: [css({
    transform: replaceAbsolutePaths,
  })],
}, {
  input: "./code/styles/elements/_elements.mjs",
  output: {
    file: "./public/css/hollows-rpg-elements.mjs",
    format: "esm",
    assetFileNames: "hollows-rpg-elements.css",
  },
  plugins: [css({
    transform: replaceAbsolutePaths,
  })],
}];
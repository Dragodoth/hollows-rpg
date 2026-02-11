import css from "rollup-plugin-import-css";

export default [{
  input: "./hollows-rpg.mjs",
  output: {
    file: "./public/hollows-rpg.mjs",
    format: "esm",
    sourcemap: true,
  },
}, {
  input: "./styles/system/_system.mjs",
  output: {
    file: "./public/css/hollows-rpg-system.mjs",
    format: "esm",
    assetFileNames: "hollows-rpg-system.css",
  },
  plugins: [css()],
}, {
  input: "./styles/variables/_variables.mjs",
  output: {
    file: "./public/css/hollows-rpg-variables.mjs",
    format: "esm",
    assetFileNames: "hollows-rpg-variables.css",
  },
  plugins: [css()],
}, {
  input: "./styles/elements/_elements.mjs",
  output: {
    file: "./public/css/hollows-rpg-elements.mjs",
    format: "esm",
    assetFileNames: "hollows-rpg-elements.css",
  },
  plugins: [css()],
}];
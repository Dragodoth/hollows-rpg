import Showdown from "showdown";

// Options copied from foundry's constants.mjs
const converter = new Showdown.Converter({
  disableForced4SpacesIndentedSublists: true,
  noHeaderId: true,
  parseImgDimensions: true,
  strikethrough: true,
  tables: true,
  tablesHeaderId: true,
});
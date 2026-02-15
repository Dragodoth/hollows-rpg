import ModelCollection from "../../utils/model-collection.mjs";

declare module "./pseudo-document.mjs" {
  export default interface PseudoDocument {
    _id: string;
    name: string;
    img: string;
    collection: ModelCollection<this>
  }
}
}
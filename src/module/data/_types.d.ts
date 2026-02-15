import "./actor/_types";
import "./pseudo-documents/_types";

export type PseudoDocumentMetadata = {
  /** The document name of this pseudo-document. */
  documentName: string,
  /** File path for a default image. */
  defaultImage: string | null;
  /** The font-awesome icon for this pseudo-document type. */
  icon: string;
  /** Record of document names of pseudo-documents and the path to the collection. */
  embedded: Record<string, string>,
  /** The class used to render this pseudo-document. */
  sheetClass?: PseudoDocumentSheet,
};
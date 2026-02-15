type ClientDocument = ReturnType<typeof foundry.documents.abstract.ClientDocumentMixin>;

declare module "./document-sheet.mjs" {
  export default interface HollowsDocumentSheet extends foundry.applications.api.DocumentSheet {
    document: InstanceType<ClientDocument>;
  }
}
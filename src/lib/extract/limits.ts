/**
 * Largest SBC we accept. Vercel functions reject request bodies over 4.5 MB,
 * and real SBCs are well under 1 MB, so 4 MB leaves room for multipart overhead.
 */
export const MAX_PDF_BYTES = 4 * 1024 * 1024;

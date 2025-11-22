
import { DocumentResource } from '../types';

/**
 * Helper to convert file to Base64 string.
 * This allows storing the file content in LocalStorage (JSON) so it persists across reloads.
 * Note: LocalStorage has a size limit (usually 5MB). Large files will fail in this demo architecture.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const uploadDocumentToServer = async (file: File, category: string, title: string): Promise<DocumentResource> => {
  
  // Check size limit for demo purposes (LocalStorage is limited)
  if (file.size > 3 * 1024 * 1024) { // 3MB limit warning
      throw new Error("Fichier trop volumineux pour le stockage local de démo (Max 3MB).");
  }

  try {
      // Convert content to persistent string
      const base64Url = await fileToBase64(file);

      const newDoc: DocumentResource = {
        id: Math.random().toString(36).substr(2, 9),
        title: title || file.name,
        category: category,
        url: base64Url, // This is a Data URI (data:application/pdf;base64,...)
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        updatedAt: new Date()
      };

      return newDoc;
  } catch (e) {
      console.error("Upload processing error", e);
      throw e;
  }
};

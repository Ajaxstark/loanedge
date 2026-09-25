const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL;

/**
 * Backend se aaya relative file path ka full URL banata hai.
 *
 * Example:
 *   getStorageUrl('kyc_documents/aadhar.pdf')
 *   → 'http://localhost:8000/storage/kyc_documents/aadhar.pdf'
 */
export function getStorageUrl(filePath) {
  if (!filePath) return null;

  // Agar already full URL hai toh wahi return karo
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const cleanPath = filePath.replace(/^\/+/, '');
  return `${STORAGE_BASE_URL}/${cleanPath}`;
}
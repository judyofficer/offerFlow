import { set, get, del } from 'idb-keyval';

export const saveFileToIDB = async (file: File): Promise<string> => {
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await set(fileId, file);
  return fileId;
};

export const getFileFromIDB = async (fileId: string): Promise<File | Blob | undefined> => {
  return await get(fileId);
};

export const deleteFileFromIDB = async (fileId: string): Promise<void> => {
  await del(fileId);
};

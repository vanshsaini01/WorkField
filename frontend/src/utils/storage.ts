/**
 * Utility functions for client-side local storage of worker profile photos and resumes.
 * Guarantees zero data loss even if backend uploads or static file storage have permissions/disk issues.
 */

export interface SavedResume {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  lastModified?: number;
  uploadedAt: string;
}

/**
 * Resize and compress an image file to a base64 Data URL.
 * Keeps file size small (~30-80KB) so it safely fits within browser localStorage quotas.
 */
export const compressImage = (
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        resolve(compressedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Read any file (PDF, Doc, Image) as a Base64 Data URL.
 */
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Profile Photo Storage ---

export const getPhotoKey = (userId?: number | string): string => {
  return `fieldwork_photo_${userId || 'current'}`;
};

export const saveLocalProfilePhoto = (userId: number | string | undefined, dataUrl: string): void => {
  try {
    localStorage.setItem(getPhotoKey(userId), dataUrl);
    window.dispatchEvent(new CustomEvent('profile_photo_updated', { detail: dataUrl }));
  } catch (err) {
    console.warn('Failed to save profile photo to localStorage (quota exceeded?):', err);
  }
};

export const getLocalProfilePhoto = (userId?: number | string): string | null => {
  try {
    return localStorage.getItem(getPhotoKey(userId));
  } catch {
    return null;
  }
};

export const removeLocalProfilePhoto = (userId?: number | string): void => {
  try {
    localStorage.removeItem(getPhotoKey(userId));
    window.dispatchEvent(new CustomEvent('profile_photo_updated', { detail: '' }));
  } catch (err) {
    console.warn('Failed to remove photo from localStorage:', err);
  }
};

// --- Resume Document Storage ---

export const getResumeKey = (userId?: number | string): string => {
  return `fieldwork_resume_${userId || 'current'}`;
};

export const saveLocalResume = (userId: number | string | undefined, resume: SavedResume): void => {
  try {
    localStorage.setItem(getResumeKey(userId), JSON.stringify(resume));
  } catch (err) {
    console.warn('Failed to save resume to localStorage (quota exceeded?):', err);
  }
};

export const getLocalResume = (userId?: number | string): SavedResume | null => {
  try {
    const raw = localStorage.getItem(getResumeKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as SavedResume;
  } catch {
    return null;
  }
};

export const removeLocalResume = (userId?: number | string): void => {
  try {
    localStorage.removeItem(getResumeKey(userId));
  } catch (err) {
    console.warn('Failed to remove resume from localStorage:', err);
  }
};

/**
 * Safely view or download a document regardless of whether it's a Base64 Data URL,
 * a relative server path (/uploads/...), or a full external URL (http://...).
 */
export const downloadOrOpenDocument = (url: string, filename = 'Worker_Resume.pdf'): void => {
  if (!url) return;

  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];

      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mimeString });
      const blobUrl = URL.createObjectURL(blob);

      // Try opening in new window, fallback to link trigger
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error handling data URL document:', err);
      // Fallback: direct download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } else {
    const targetUrl = url.startsWith('http') || url.startsWith('/') ? url : `https://${url}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Format bytes to readable size (e.g. 245 KB).
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};


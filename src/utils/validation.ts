export function validateFile(file: File): string | null {
    if (!file.type.match(/pdf|image\//)) {
      return "Only PDFs or image files are allowed.";
    }
    if (file.size > 2 * 1024 * 1024) {
      return "File must be under 2MB.";
    }
    return null;
  }
export function isValidFile(file: unknown): file is File {
  if (!file) return false;

  if (file instanceof File) {
    return file.size > 0;
  }

  if (typeof file === "object" && file !== null) {
    const f = file as Record<string, unknown>;
    return (
      typeof f.size === "number" &&
      f.size > 0 &&
      typeof f.type === "string" &&
      typeof f.arrayBuffer === "function"
    );
  }

  return false;
}

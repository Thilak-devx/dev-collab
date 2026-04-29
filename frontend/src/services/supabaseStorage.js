import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;
const maxTaskFileSize = 5 * 1024 * 1024;
const allowedTaskFileTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const getSupabaseCredentials = () => ({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const hasSupabaseStorageConfig = () => {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
};

export const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    throw new Error("Supabase storage is not configured");
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
};

const sanitizeFileName = (value) =>
  value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");

export const validateTaskFile = (file) => {
  if (!file) {
    throw new Error("Select a file to upload");
  }

  if (!allowedTaskFileTypes.has(file.type)) {
    throw new Error("Unsupported file type. Upload PDF, DOCX, TXT, PNG, JPG, or WEBP files.");
  }

  if (file.size > maxTaskFileSize) {
    throw new Error("Files must be 5MB or smaller.");
  }
};

export const uploadTaskFileToSupabase = async ({ file, taskId }) => {
  validateTaskFile(file);
  const client = getSupabaseClient();
  const fileExtension = file.name.includes(".") ? file.name.split(".").pop() : "";
  const baseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, "")) || "file";
  const storagePath = `${taskId}/${Date.now()}-${baseName}${fileExtension ? `.${fileExtension}` : ""}`;

  const { error } = await client.storage
    .from("task-files")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from("task-files").getPublicUrl(storagePath);

  return {
    fileName: file.name,
    fileUrl: data.publicUrl,
    fileType: file.type,
    fileSize: file.size,
  };
};

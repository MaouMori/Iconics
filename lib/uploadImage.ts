import { supabase } from "@/lib/supabase";

export async function uploadPublicImage(
  file: File,
  bucket: "member-images" | "event-images" | "member-gallery"
) {
  const ext = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}
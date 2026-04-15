import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extFromMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;

  const form = await req.formData();
  const file = form.get("file");
  const folderRaw = String(form.get("folder") || "posts").trim().toLowerCase();
  const folder = ["posts", "chat", "avatars"].includes(folderRaw) ? folderRaw : "posts";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo acima de 8MB." }, { status: 400 });
  }

  const mutedUntil = profile.social_muted_until ? String(profile.social_muted_until) : "";
  if (mutedUntil && new Date(mutedUntil).getTime() > Date.now()) {
    return NextResponse.json({ error: "Sua conta está temporariamente silenciada para postagem." }, { status: 403 });
  }

  const ext = extFromMime(file.type);
  const safeUser = String(profile.id).replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = `${folder}/${safeUser}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage
    .from("social-media")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from("social-media").getPublicUrl(filePath);
  return NextResponse.json({ ok: true, url: data.publicUrl, path: filePath });
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canManageMissions } from "@/lib/missionRules";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function extFromFile(file: File) {
  const byName = file.name.split(".").pop()?.toLowerCase();
  if (byName && /^[a-z0-9]{2,5}$/.test(byName)) return byName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime") return "mov";
  return "bin";
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  const form = await req.formData();
  const file = form.get("file");
  const purpose = String(form.get("purpose") || "proof").trim();
  const isMissionImage = purpose === "mission-image";

  if (isMissionImage && !canManageMissions(auth.profile.cargo)) {
    return NextResponse.json({ error: "Apenas lideranca pode enviar imagem de missao." }, { status: 403 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo invalido." }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Formato invalido. Envie imagem ou video." }, { status: 400 });
  }

  if (file.size > 32 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo acima de 32MB." }, { status: 400 });
  }

  const ext = extFromFile(file);
  const safeUser = String(auth.userId).replace(/[^a-zA-Z0-9_-]/g, "");
  const folder = isMissionImage ? "mission-images" : "mission-proofs";
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
  return NextResponse.json({
    ok: true,
    file: {
      name: file.name,
      url: data.publicUrl,
      path: filePath,
      type: file.type,
      size: file.size,
    },
  });
}

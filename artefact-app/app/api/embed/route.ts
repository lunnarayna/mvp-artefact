import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    const { pipeline } = await import("@xenova/transformers");
    extractor = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32", { revision: "main" });
  }
  return extractor;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { designId, imageBase64, mimeType, userId } = await request.json();
    if (!designId || !imageBase64 || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: design, error: designError } = await supabase
      .from("designs").select("id, storage_path").eq("id", designId).eq("user_id", userId).single();

    if (designError || !design) return NextResponse.json({ error: "Design not found" }, { status: 404 });

    const permanentUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/designs/${design.storage_path}`;

    console.log("[embed] loading model...");
    const ext = await getExtractor();
    const { RawImage } = await import("@xenova/transformers");
    const buffer = Buffer.from(imageBase64, "base64");
    const uint8 = new Uint8Array(buffer);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const image = await (RawImage as any).fromBlob(new Blob([uint8], { type: mimeType ?? "image/jpeg" }));
    const output = await ext(image, { pooling: "mean", normalize: true } as Record<string, unknown>) as { data: Float32Array };
    const embedding: number[] = Array.from(output.data as Float32Array);

    console.log("[embed] embedding ready, dimensions:", embedding.length);

    const { error: updateError } = await supabase
      .from("designs")
      .update({ embedding, permanent_url: permanentUrl })
      .eq("id", designId);

    if (updateError) throw updateError;
    return NextResponse.json({ success: true, dimensions: embedding.length });
  } catch (err) {
    console.error("[embed] error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
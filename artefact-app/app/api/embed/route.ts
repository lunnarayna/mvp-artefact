import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { pipeline, RawImage } from "@xenova/transformers";

// Cache the pipeline across requests (warm-up only happens once)
let extractor: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32", {
      revision: "main",
    });
  }
  return extractor;
}

export async function POST(request: NextRequest) {
  try {
    const { designId, imageBase64, mimeType } = await request.json();

    if (!designId || !imageBase64) {
      return NextResponse.json({ error: "Missing designId or imageBase64" }, { status: 400 });
    }

    // Auth check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Confirm the design belongs to this user
    const { data: design, error: designError } = await supabase
      .from("designs")
      .select("id")
      .eq("id", designId)
      .eq("user_id", user.id)
      .single();

    if (designError || !design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    // Generate embedding
    const ext = await getExtractor();
    const dataUrl = `data:${mimeType ?? "image/png"};base64,${imageBase64}`;
    const image = await RawImage.fromURL(dataUrl);
    const output = await ext(image, { pooling: "mean", normalize: true });
    const embedding: number[] = Array.from(output.data as Float32Array);

    // Save embedding to DB
    const { error: updateError } = await supabase
      .from("designs")
      .update({ embedding })
      .eq("id", designId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, dimensions: embedding.length });
  } catch (err) {
    console.error("[embed] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, designId, userId } = await request.json();

    if (!imageUrl || !designId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: design, error: designError } = await supabase
      .from("designs")
      .select("id, file_name")
      .eq("id", designId)
      .eq("user_id", userId)
      .single();

    if (designError || !design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    console.log("[search-web] fetching image for Gemini analysis:", imageUrl);

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
    const imgBuffer = await imgRes.arrayBuffer();
    const imgBase64 = Buffer.from(imgBuffer).toString("base64");
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";

    const prompt = `Analyze this design image carefully and respond with a single JSON object (no markdown, no extra text) with exactly these two fields:

"description": a 2-sentence description in Brazilian Portuguese of what this design is and its visual style, written in a commercial and engaging tone (e.g. "Um aplicativo de gestao financeira com visual moderno em tons de azul escuro e verde. O layout limpo e os graficos interativos transmitem confianca e profissionalismo.").

"keywords": an array of 4 to 6 short English search phrases that capture the visual style, color palette, aesthetic movement, and subject matter of the design — useful for finding similar work on Google Images, Pinterest, or Dribbble.

Example response:
{"description":"Um dashboard de analytics com tema escuro e acentos em roxo vibrante. A composicao equilibrada e a tipografia moderna comunicam sofisticacao e foco em dados.","keywords":["dark analytics dashboard","purple accent data visualization","minimal dark UI","modern SaaS interface design","data dashboard dribbble"]}`;

    console.log("[search-web] calling Gemini for analysis...");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // Only use models confirmed available for this API key
    const MODEL_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"];
    const MAX_RETRIES = 2;

    const errStatus = (err: unknown): number | null =>
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : null;

    let result;

    outer: for (const modelName of MODEL_FALLBACKS) {
      const model = genAI.getGenerativeModel({ model: modelName });
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          result = await model.generateContent([
            { inlineData: { mimeType: contentType, data: imgBase64 } },
            { text: prompt },
          ]);
          console.log(`[search-web] succeeded with model ${modelName}`);
          break outer;
        } catch (err: unknown) {
          const status = errStatus(err);
          if (status === 429 && attempt < MAX_RETRIES - 1) {
            const delay = Math.pow(2, attempt) * 4000;
            console.warn(`[search-web] rate limited on ${modelName}, retrying in ${delay}ms`);
            await new Promise((r) => setTimeout(r, delay));
          } else if (status === 429 || status === 404) {
            console.warn(`[search-web] ${modelName} unavailable (${status}), trying next model`);
            break;
          } else {
            throw err;
          }
        }
      }
    }

    let description = "";
    let keywords: string[] = [];

    if (result) {
      const responseText = result.response.text();
      console.log("[search-web] raw Gemini response:", responseText);
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        description = typeof parsed.description === "string" ? parsed.description : "";
        keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      } catch {
        console.warn("[search-web] failed to parse Gemini response");
      }
    }

    if (keywords.length === 0) {
      console.log("[search-web] Gemini unavailable, no AI keywords generated");
    }

    const searchLinks = keywords.map((kw: string) => ({
      title: kw,
      url: `https://www.google.com/search?q=${encodeURIComponent(kw)}&tbm=isch`,
      pinterestUrl: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(kw)}`,
    }));

    console.log(`[search-web] generated ${searchLinks.length} links`);
    return NextResponse.json({ description, keywords, searchLinks });
  } catch (err) {
    console.error("[search-web] error:", err);
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    if (status === 429) {
      return NextResponse.json(
        { error: "Gemini quota exceeded. Please try again in a few minutes." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

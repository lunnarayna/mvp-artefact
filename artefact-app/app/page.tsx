"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

// ── Icons ──────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const UploadIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
  </svg>
);
const SearchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
  </svg>
);
const BellIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
  </svg>
);
const HelpIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"/>
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
  </svg>
);
const FigmaIcon = () => (
  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z" fill="#0ACF83"/>
    <path d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z" fill="#A259FF"/>
    <path d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z" fill="#F24E1E"/>
    <path d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z" fill="#FF7262"/>
    <path d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z" fill="#1ABCFE"/>
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────
type SimilarityLevel = "VERY SIMILAR" | "MODERATELY SIMILAR" | "DISTANTLY SIMILAR";

interface OwnMatch {
  id: string;
  fileName: string;
  signedUrl: string | null;
  similarity: number;
  level: string;
  createdAt: string;
}
interface SearchLink {
  title: string;
  url: string;
  pinterestUrl: string;
}
interface GardenDesign {
  id: string;
  file_name: string;
  permanent_url: string | null;
  storage_path: string;
  created_at: string;
  saved: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const levelColors: Record<SimilarityLevel, string> = {
  "VERY SIMILAR": "bg-[#9A0458]/10 text-[#9A0458]",
  "MODERATELY SIMILAR": "bg-amber-50 text-amber-700",
  "DISTANTLY SIMILAR": "bg-slate-100 text-slate-500",
};
const scoreColor = (s: number) =>
  s >= 85 ? "bg-[#9A0458] text-white" : s >= 70 ? "bg-amber-500 text-white" : "bg-slate-400 text-white";
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Nav ────────────────────────────────────────────────────────────────────
const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: "garden",
    label: "My Garden",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7.5 3 12c0 1.5.5 3 1 4l8-8 8 8c.5-1 1-2.5 1-4 0-4.5-4-9-9-9z"/>
        <path strokeLinecap="round" d="M12 21v-9"/>
      </svg>
    ),
  },
];

// ── DropZone ───────────────────────────────────────────────────────────────
type UploadStatus = "idle" | "uploading" | "confirm" | "success" | "error";

function DropZone({
  userId,
  onUploadComplete,
}: {
  userId: string;
  onUploadComplete: (designId: string, previewUrl: string, publicUrl: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Only image files supported.");
      setStatus("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File too large. Max 10MB.");
      setStatus("error");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setPendingFile(file);
    setStatus("confirm");
  };

  const doUpload = async () => {
    if (!pendingFile) return;
    setStatus("uploading");
    try {
      const base64 = await toBase64(pendingFile);
      const mimeType = pendingFile.type;
      const ext = pendingFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const storagePath = `${userId}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from("designs")
        .upload(storagePath, pendingFile, { upsert: false });
      if (storageError) throw storageError;

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/designs/${storagePath}`;

      const { data: record, error: dbError } = await supabase
        .from("designs")
        .insert({
          user_id: userId,
          file_name: pendingFile.name,
          storage_path: storagePath,
          public_url: publicUrl,
          permanent_url: publicUrl,
          saved: false,
        })
        .select("id")
        .single();

      if (dbError) throw dbError;
      if (!record?.id) throw new Error("No record id returned");

      setStatus("success");
      onUploadComplete(record.id, preview as string, publicUrl);

      fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: record.id, imageBase64: base64, mimeType, userId }),
      })
        .then(async (r) => {
          const json = await r.json();
          console.log("[embed] response:", json);
        })
        .catch((err) => console.warn("[embed] fetch error:", err));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setPreview(null);
    setPendingFile(null);
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (status === "idle" || status === "error") setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
      onClick={() => {
        if (status === "idle" || status === "error") inputRef.current?.click();
      }}
      className={`rounded-3xl border-2 border-dashed p-10 md:p-14 flex flex-col items-center justify-center text-center transition-all duration-200 ${
        status === "uploading"
          ? "border-[#9A0458]/40 bg-[#9A0458]/3 cursor-wait"
          : status === "confirm"
          ? "border-[#9A0458] bg-white cursor-default"
          : status === "success"
          ? "border-emerald-300 bg-emerald-50 cursor-default"
          : status === "error"
          ? "border-red-300 bg-red-50 cursor-pointer"
          : isDragging
          ? "border-[#9A0458] bg-[#9A0458]/5 cursor-copy"
          : "border-[#9A0458]/25 bg-white hover:border-[#9A0458]/50 cursor-pointer"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {status === "uploading" && (
        <>
          {preview && <img src={preview} alt="" className="max-w-xs max-h-48 object-contain mb-4 opacity-60" />}
          <div className="w-8 h-8 border-4 border-slate-100 border-t-[#9A0458] rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-[#9A0458]">Uploading design...</p>
        </>
      )}

      {status === "confirm" && (
        <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {preview && <img src={preview} alt="" className="max-w-xs max-h-60 object-contain" />}
          <p className="text-sm font-semibold text-slate-700">Ready to analyse this design?</p>
          <div className="flex gap-3">
            <button
              onClick={doUpload}
              className="px-5 py-2.5 bg-[#9A0458] text-white text-sm font-semibold rounded-xl hover:bg-[#7d0348] transition-colors"
            >
              Start Analysis
            </button>
            <button onClick={reset} className="px-4 py-2.5 text-slate-400 text-sm hover:text-slate-600 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === "success" && (
        <>
          {preview && (
            <div className="relative mb-5">
              <img src={preview} alt="" className="max-w-sm max-h-80 object-contain" />
              <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm shadow-md">
                ✓
              </div>
            </div>
          )}
          <p className="text-sm font-semibold text-emerald-700 mt-2">Design uploaded successfully</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Upload another
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xl mb-3">
            ✕
          </div>
          <p className="text-sm font-semibold text-red-600">Upload failed</p>
          <p className="text-xs text-red-400 mt-1 max-w-xs">{errorMsg}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Try again
          </button>
        </>
      )}

      {status === "idle" && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-[#9A0458]/8 flex items-center justify-center text-[#9A0458] mb-4">
            <UploadIcon />
          </div>
          <h3 className="text-lg font-bold text-[#9A0458] mb-1">Drop a design to start a forensic search</h3>
          <p className="text-sm text-slate-400 mb-5">Supports PNG, JPG, WebP · Max 10MB</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            Browse Files
          </button>
        </>
      )}
    </div>
  );
}

// ── My Garden Tab ──────────────────────────────────────────────────────────
function MyGardenTab({ userId }: { userId: string }) {
  const [designs, setDesigns] = useState<GardenDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/garden?userId=${userId}`);
    const data = await res.json();
    setDesigns(data.designs ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this design from your garden?")) return;
    setDeleting(id);
    await fetch("/api/garden", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designId: id, userId }),
    });
    setDesigns((prev) => prev.filter((d) => d.id !== id));
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-[#9A0458] rounded-full animate-spin" />
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="text-center py-24 select-none">
        <div className="text-5xl mb-3">🌱</div>
        <p className="text-sm font-medium text-slate-400">Your garden is empty.</p>
        <p className="text-xs text-slate-300 mt-1">Save designs after analysis to grow your garden.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900">My Garden</h1>
        <span className="text-xs text-slate-400">
          {designs.length} saved {designs.length === 1 ? "design" : "designs"}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {designs.map((d) => (
          <div key={d.id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative aspect-square bg-slate-50">
              {d.permanent_url ? (
                <img src={d.permanent_url} alt={d.file_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">🖼</div>
              )}
              <button
                onClick={() => handleDelete(d.id)}
                disabled={deleting === d.id}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              >
                {deleting === d.id ? (
                  <div className="w-3 h-3 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin" />
                ) : (
                  <TrashIcon />
                )}
              </button>
            </div>
            <div className="p-2.5">
              <p className="text-[12px] font-semibold text-slate-700 truncate">{d.file_name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(d.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tutorial ───────────────────────────────────────────────────────────────
const TUTORIAL_STEPS = [
  {
    emoji: "🌿",
    title: "Bem-vindo ao EchoGarden",
    body: "O EchoGarden revela a identidade visual dos seus designs. Faça o upload de uma tela ou conceito e descubra o que ele tem em comum com o que ja foi criado antes, pelo mundo afora ou pelo seu proprio historico.",
  },
  {
    emoji: "📤",
    title: "Envie um design para analisar",
    body: "Arraste e solte qualquer imagem PNG, JPG ou WebP de ate 10 MB na area de upload. Clique em 'Start Analysis' para confirmar e o EchoGarden comeca a trabalhar na analise completa.",
  },
  {
    emoji: "🌱",
    title: "Your Garden: seus proprios ecos",
    body: "Aqui voce ve quais dos designs que ja enviou anteriormente se parecem com o atual. Quanto maior a porcentagem, mais proximo o design esta dos que voce ja enviou.",
  },
  {
    emoji: "🧭",
    title: "Others Garden: inspiracoes da web",
    body: "A IA descreve o estilo visual do seu design e gera links de busca prontos para o Google Imagens e Pinterest. Explore referencias visuais similares com um clique, sem sair da plataforma.",
  },
  {
    emoji: "💾",
    title: "Salve e construa seu acervo",
    body: "Clique em 'Save to Garden' para guardar o design no seu acervo pessoal. Apenas os designs salvos sao usados nas comparacoes futuras, entao voce decide o que faz parte do seu jardim.",
  },
];

function TutorialModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-[#9A0458] transition-all duration-300"
            style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex gap-1.5 mb-6">
            {TUTORIAL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === step ? "bg-[#9A0458] w-6" : "bg-slate-200 w-3 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-5xl mb-5 select-none">{current.emoji}</div>
          <h2 className="text-xl font-black text-slate-900 mb-3 leading-snug">{current.title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{current.body}</p>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-sm text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-[11px] text-slate-300 font-medium">
            {step + 1} / {TUTORIAL_STEPS.length}
          </span>
          {isLast ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#9A0458] text-white text-sm font-semibold rounded-xl hover:bg-[#7d0348] transition-colors"
            >
              Começar →
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2.5 bg-[#9A0458] text-white text-sm font-semibold rounded-xl hover:bg-[#7d0348] transition-colors"
            >
              Próximo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [uploadedDesignId, setUploadedDesignId] = useState<string | null>(null);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [savedToGarden, setSavedToGarden] = useState(false);
  const [ownGarden, setOwnGarden] = useState<OwnMatch[]>([]);
  const [searchLinks, setSearchLinks] = useState<SearchLink[]>([]);
  const [isMatchingOwn, setIsMatchingOwn] = useState(false);
  const [isMatchingWeb, setIsMatchingWeb] = useState(false);
  const [webSearchError, setWebSearchError] = useState<"quota" | "error" | null>(null);
  const [currentPublicUrl, setCurrentPublicUrl] = useState<string | null>(null);
  const [webDescription, setWebDescription] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("echogarden_tutorial_seen");
  });

  const openTutorial = () => setShowTutorial(true);
  const closeTutorial = () => {
    localStorage.setItem("echogarden_tutorial_seen", "1");
    setShowTutorial(false);
  };

  const firstName = user.email?.split("@")[0] ?? "there";
  const avatarLetter = firstName[0]?.toUpperCase();

  const handleSaveToGarden = async () => {
    if (!currentDesignId) return;
    const { error } = await supabase
      .from("designs")
      .update({ saved: true })
      .eq("id", currentDesignId)
      .eq("user_id", user.id);
    if (error) {
      console.error("[save-to-garden] error:", error);
      alert("Failed to save: " + error.message);
      return;
    }
    console.log("[save-to-garden] saved design:", currentDesignId);
    setSavedToGarden(true);
  };

  const handleUploadComplete = async (designId: string, _preview: string, publicUrl: string) => {
    setUploadedDesignId(designId);
    setCurrentDesignId(designId);
    setCurrentPublicUrl(publicUrl);
    setSavedToGarden(false);
    setOwnGarden([]);
    setSearchLinks([]);
    setWebSearchError(null);
    setWebDescription(null);
    setIsMatchingOwn(true);
    setIsMatchingWeb(true);

    const pollOwn = async (attempts = 0): Promise<void> => {
      if (attempts > 12) {
        setIsMatchingOwn(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, userId: user.id }),
      });
      const data = await res.json();
      if (data.error === "Design or embedding not found") {
        return pollOwn(attempts + 1);
      }
      setOwnGarden(data.ownGarden ?? []);
      setIsMatchingOwn(false);
    };

    pollOwn();
    searchWeb(publicUrl, designId);
  };

  const searchWeb = async (imageUrl: string, dId: string) => {
    setIsMatchingWeb(true);
    setWebSearchError(null);
    setWebDescription(null);
    try {
      console.log("[search-web] calling url:", imageUrl);
      const res = await fetch("/api/search-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, designId: dId, userId: user.id }),
      });
      const data = await res.json();
      console.log("[search-web] result:", data);
      if (res.status === 429) {
        setWebSearchError("quota");
      } else if (!res.ok) {
        setWebSearchError("error");
      } else {
        setWebDescription(data.description ?? null);
        setSearchLinks(data.searchLinks ?? []);
      }
    } catch (err) {
      console.warn("[search-web] error:", err);
      setWebSearchError("error");
    } finally {
      setIsMatchingWeb(false);
    }
  };

  const isSearching = isMatchingOwn || isMatchingWeb;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-100 flex flex-col justify-between py-6 shrink-0 fixed h-full z-10">
        <div>
          <div className="px-5 mb-7">
            <h2 className="text-lg font-black text-[#9A0458] tracking-tight leading-none">EchoGarden</h2>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">Empathetic Forensics</span>
          </div>
          <nav className="px-3 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  activeTab === item.id
                    ? "bg-[#9A0458] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className={activeTab === item.id ? "text-white" : "text-slate-400"}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="px-3 space-y-1">
          <button
            onClick={openTutorial}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"/>
            </svg>
            Tutorial
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-medium text-slate-600">Path</span>
            <span>/</span>
            <span className="font-semibold text-[#9A0458]">{activeTab === "garden" ? "My Garden" : "Investigation Lab"}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors">
              <BellIcon />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#9A0458] text-white text-xs font-bold flex items-center justify-center">
              {avatarLetter}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {activeTab === "garden" ? (
            <MyGardenTab userId={user.id} />
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {getGreeting()}, {firstName}
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">Let&apos;s uncover the visual DNA of your latest concept.</p>
              </div>

              <div className="mb-8">
                <DropZone userId={user.id} onUploadComplete={handleUploadComplete} />
              </div>

              {!uploadedDesignId && (
                <div className="text-center py-16 select-none">
                  <div className="text-5xl mb-3">🌿</div>
                  <p className="text-sm font-medium text-slate-400">Your garden is empty.</p>
                  <p className="text-xs text-slate-300 mt-1">Drop a design above to start your first forensic search.</p>
                </div>
              )}

              {uploadedDesignId && isSearching && (
                <div className="text-center py-16 select-none">
                  <div className="w-8 h-8 border-4 border-slate-100 border-t-[#9A0458] rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm font-medium text-slate-500">Searching for visual echoes...</p>
                  <p className="text-xs text-slate-300 mt-1">
                    {isMatchingOwn && isMatchingWeb
                      ? "Scanning your garden and the web"
                      : isMatchingOwn
                      ? "Scanning your garden..."
                      : "Searching the web..."}
                  </p>
                </div>
              )}

              {uploadedDesignId && !isSearching && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Your Garden */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🌱</span>
                          <h2 className="text-sm font-bold text-slate-800">Your Garden</h2>
                        </div>
                        <span className="text-xs text-slate-400">{ownGarden.length} matches</span>
                      </div>
                      {ownGarden.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                          <p className="text-sm text-slate-400">No echoes found in your upload history.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {ownGarden.map((m) => (
                            <div
                              key={m.id}
                              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-3 p-3">
                                {m.signedUrl ? (
                                  <img src={m.signedUrl} alt={m.fileName} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                                ) : (
                                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">{m.fileName}</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{new Date(m.createdAt).toLocaleDateString()}</p>
                                  <span
                                    className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      levelColors[m.level as SimilarityLevel] ?? "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {m.level}
                                  </span>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full flex-shrink-0 ${scoreColor(m.similarity)}`}>
                                  {m.similarity}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Others' Garden */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🧭</span>
                          <h2 className="text-sm font-bold text-slate-800">Others&apos; Garden</h2>
                        </div>
                        <span className="text-xs text-slate-400">{searchLinks.length} leads</span>
                      </div>
                      {webSearchError ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center space-y-3">
                          {webSearchError === "quota" ? (
                            <>
                              <p className="text-sm font-medium text-amber-600">Limite da API Gemini atingido.</p>
                              <p className="text-xs text-slate-400">A cota gratuita foi esgotada. Tente novamente em alguns minutos.</p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-400">Erro ao buscar inspirações visuais.</p>
                          )}
                          {currentDesignId && currentPublicUrl && (
                            <button
                              onClick={() => searchWeb(currentPublicUrl!, currentDesignId!)}
                              disabled={isMatchingWeb}
                              className="px-4 py-2 bg-[#9A0458] text-white text-xs font-semibold rounded-xl hover:bg-[#7d0348] transition-colors disabled:opacity-50"
                            >
                              {isMatchingWeb ? "Buscando..." : "Tentar novamente"}
                            </button>
                          )}
                        </div>
                      ) : searchLinks.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                          <p className="text-sm text-slate-400">Nenhuma inspiracao visual encontrada para este design.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {webDescription && (
                            <div className="bg-white rounded-2xl border border-slate-100 p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Sobre este design</p>
                              <p className="text-[13px] text-slate-600 leading-relaxed">{webDescription}</p>
                            </div>
                          )}
                          {searchLinks.map((link, i) => (
                            <div
                              key={i}
                              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow p-4"
                            >
                              <p className="text-[13px] font-semibold text-slate-800 leading-tight mb-3">
                                &ldquo;{link.title}&rdquo;
                              </p>
                              <div className="flex gap-2">
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-center px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                                >
                                  Buscar no Google Imagens
                                </a>
                                <a
                                  href={link.pinterestUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-center px-3 py-2 bg-[#9A0458]/8 hover:bg-[#9A0458]/15 text-[#9A0458] text-xs font-medium rounded-lg transition-colors"
                                >
                                  Buscar no Pinterest
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save to garden prompt */}
                  {!savedToGarden ? (
                    <div className="mt-6 flex items-center justify-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-sm text-slate-600">Want to save this design to your garden?</p>
                      <button
                        onClick={handleSaveToGarden}
                        className="px-4 py-2 bg-[#9A0458] text-white text-sm font-semibold rounded-xl hover:bg-[#7d0348] transition-colors whitespace-nowrap"
                      >
                        Save to Garden
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 flex items-center justify-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-emerald-600 text-sm font-semibold">✓ Saved to your garden</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      {showTutorial && <TutorialModal onClose={closeTutorial} />}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center antialiased">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#9A0458] rounded-full animate-spin mb-2" />
        <p className="text-slate-400 text-xs font-medium">Carregando laboratório...</p>
      </main>
    );
  }

  if (user) return <Dashboard user={user} onLogout={handleLogout} />;

  return (
    <main className="min-h-screen bg-white flex flex-col md:flex-row antialiased overflow-hidden">
      <div
        className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-end relative min-h-[45vh] md:min-h-screen bg-cover bg-center rounded-none md:rounded-r-[24px]"
        style={{ backgroundImage: `url('/EchoGarden.png')` }}
      >
        <div className="relative z-10 text-white select-none hidden md:block">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-2 drop-shadow-sm">EchoGarden</h1>
          <p className="text-white/90 text-sm md:text-lg font-medium tracking-wide">Empathetic Forensics & Design Analysis</p>
        </div>
      </div>
      <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center bg-white">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-4xl font-bold text-black tracking-tight mb-3">Entrar</h2>
          <p className="text-slate-600 text-sm mb-8 max-w-[280px] mx-auto">Acesse sua conta para iniciar uma busca forense visual</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 font-medium py-3.5 px-5 border border-slate-200 rounded-xl transition-all duration-200 active:scale-[0.99] shadow-sm text-sm cursor-pointer"
          >
            <GoogleIcon />
            Entrar com o Google
          </button>
        </div>
      </div>
    </main>
  );
}
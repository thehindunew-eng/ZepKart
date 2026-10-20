"use client";

import { useRef, useState } from "react";
import { Upload, Link2, X, Loader2 } from "lucide-react";
import { api } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

/** Image picker: upload a file (JPG/PNG/WebP, 5 MB max) or paste an https link. */
export function ImageUpload({ value, onChange, label = "Picture", shape = "square" }: { value: string | null; onChange: (url: string | null) => void; label?: string; shape?: "square" | "wide" | "round" }) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "image");
      const r = await api<{ url: string }>("/api/uploads", { body: fd });
      onChange(r.url);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const ratio = shape === "wide" ? "aspect-[16/6]" : shape === "round" ? "aspect-square rounded-full" : "aspect-[4/3]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink/60">{label}</span>
        <div className="glass-pill flex rounded-full p-0.5 text-[11.5px] font-bold">
          <button type="button" onClick={() => setMode("file")} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1", mode === "file" ? "bg-ink text-white" : "text-ink/70")}><Upload className="h-3 w-3" /> Upload</button>
          <button type="button" onClick={() => setMode("url")} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1", mode === "url" ? "bg-ink text-white" : "text-ink/70")}><Link2 className="h-3 w-3" /> Link</button>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className={cn("relative w-full max-w-[220px] overflow-hidden rounded-2xl border border-white/90 bg-white/60", ratio)}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[12px] font-semibold text-ink/40">No picture</div>
          )}
          {value && (
            <button type="button" onClick={() => onChange(null)} aria-label="Remove picture" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {busy && <div className="absolute inset-0 grid place-items-center bg-white/60"><Loader2 className="h-5 w-5 animate-spin" /></div>}
        </div>
        {mode === "file" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) upload(f);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            className={cn("flex-1 cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center text-[12.5px] font-semibold text-ink/60 transition", dragOver ? "border-emerald-600 bg-emerald-50/60" : "border-ink/15 hover:bg-white/50")}
          >
            <Upload className="mx-auto mb-1 h-5 w-5 text-ink/50" />
            Drop an image or <span className="text-emerald-800 underline">browse</span>
            <p className="mt-1 text-[11px] text-ink/45">JPG, PNG or WebP · up to 5 MB</p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </div>
        ) : (
          <div className="flex-1">
            <input className="field" placeholder="https://…" defaultValue={value ?? ""} onBlur={(e) => onChange(e.target.value.trim() || null)} aria-label={`${label} link`} />
            <p className="mt-1 text-[11px] text-ink/45">Paste a direct image link. It saves when you leave the box.</p>
          </div>
        )}
      </div>
    </div>
  );
}

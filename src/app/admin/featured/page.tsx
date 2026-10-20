"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { Button, EmptyState, Field, Modal, Skeleton, Switch } from "@/components/ui";
import { AdminHead, Panel } from "@/components/admin/AdminHead";

type Clip = { id: string; title: string; subtitle: string | null; videoUrl: string; durationSec: number; sortOrder: number; isActive: boolean; endsAt: string | null; campaignId: string | null };

export default function AdminFeaturedPage() {
  const { data, loading, reload } = useApi<{ clips: Clip[] }>("/api/admin/featured");
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      await api(`/api/admin/featured/${id}`, { method: "PATCH", json: body });
      await reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (c: Clip) => {
    if (!window.confirm(`Remove “${c.title}” from Featured?`)) return;
    setBusy(c.id);
    try {
      await api(`/api/admin/featured/${c.id}`, { method: "DELETE" });
      toast("Clip removed");
      await reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <AdminHead
        title="Featured clips"
        body="These clips run in the Featured row on the customer home. Only admins can add, edit or remove them."
        right={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add clip</Button>}
      />

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : (data?.clips.length ?? 0) === 0 ? (
        <Panel><EmptyState title="No featured clips yet" body="Add a clip to fill the Featured row." action={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add clip</Button>} /></Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data!.clips.map((c) => (
            <Panel key={c.id} className={`overflow-hidden ${busy === c.id ? "opacity-70" : ""}`}>
              <div className="relative aspect-[9/13] max-h-72 bg-black">
                <video src={c.videoUrl} muted loop autoPlay playsInline className="h-full w-full object-cover" />
                <span className="absolute left-2.5 top-2.5 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white">{c.durationSec}s</span>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-[14.5px] font-extrabold">{c.title}</p>
                  <p className="text-[12.5px] text-ink/55">{c.subtitle ?? "ZepKart"}{c.campaignId ? " · from an approved ad" : ""}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-[12.5px] font-bold text-ink/70">
                    Sort
                    <input
                      type="number"
                      min={0}
                      defaultValue={c.sortOrder}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v !== c.sortOrder) patch(c.id, { sortOrder: v });
                      }}
                      className="field !w-20 !rounded-lg !py-1.5 !text-[13px]"
                    />
                  </label>
                  <Switch checked={c.isActive} onChange={(v) => patch(c.id, { isActive: v })} disabled={busy === c.id} label={c.isActive ? "On" : "Off"} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-ink/50">{c.endsAt ? `Ends ${new Date(c.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "No end date"}</span>
                  <Button size="sm" variant="danger" onClick={() => remove(c)} disabled={busy === c.id}>{busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove</Button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {adding && <AddClip onClose={() => setAdding(false)} onSaved={async () => { setAdding(false); await reload(); }} />}
    </div>
  );
}

function AddClip({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", videoUrl: "", durationSec: 15, sortOrder: 0 });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (file: File) => {
    if (file.size > 60 * 1024 * 1024) return toast("Video must be 60 MB or smaller", "error");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "video");
      const r = await api<{ url: string; durationSec: number | null }>("/api/uploads", { body: fd });
      setForm((f) => ({ ...f, videoUrl: r.url, durationSec: Math.max(1, Math.ceil(r.durationSec ?? 15)), title: f.title || file.name.replace(/\.[^.]+$/, "").slice(0, 80) }));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/featured", { json: { ...form, subtitle: form.subtitle || undefined, isActive: true } });
      toast("Clip added to Featured");
      onSaved();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add a featured clip" footer={<Button type="submit" form="featured-form" loading={saving} disabled={!form.videoUrl}>Add to Featured</Button>}>
      <form id="featured-form" onSubmit={save} className="space-y-4">
        <Field label="Video" hint="MP4 or MOV up to 60 MB. Short clips (under 60 s) look best.">
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button type="button" variant="soft" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> {form.videoUrl ? "Replace video" : "Upload video"}</Button>
            {form.videoUrl && <span className="text-[12.5px] font-semibold text-leaf-deep">Uploaded · {form.durationSec}s</span>}
          </div>
        </Field>
        <Field label="Title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="field" /></Field>
        <Field label="Subtitle (optional)"><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="field" /></Field>
        <Field label="Sort order" hint="Lower numbers show first"><input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="field" /></Field>
      </form>
    </Modal>
  );
}

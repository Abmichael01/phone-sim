import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BARE_SCREEN, fitScale, frameLayout } from "@/devices/layout";
import {
  buildCustomDevice,
  customDeviceFormSchema,
  customDeviceToForm,
  newCustomDeviceId,
  type CustomDeviceForm,
} from "@/schemas/customDevice";
import { cutoutSchema, deviceKindSchema, platformSchema, type Device } from "@/schemas/device";
import { saveCustomDevices } from "@/shared/customDevices";
import { useSimulatorStore, type CustomDialog } from "@/stores/simulator";
import { DeviceFrame } from "./frame/DeviceFrame";
import { CloseIcon } from "./icons";
import { Tip } from "./ui";

type Field = keyof CustomDeviceForm;
type Draft = Record<Field, string>;

const EMPTY: Draft = {
  name: "",
  width: "390",
  height: "844",
  dpr: "3",
  platform: "ios",
  kind: "phone",
  cutout: "dynamic-island",
  screenRadius: "47",
  color: "#3a3d42",
};

const LABELS = {
  platform: { ios: "iOS", ipados: "iPadOS", android: "Android" },
  kind: { phone: "Phone", tablet: "Tablet", foldable: "Foldable" },
  cutout: {
    "dynamic-island": "Dynamic Island",
    notch: "Notch",
    "punch-hole-center": "Punch hole (centre)",
    "punch-hole-left": "Punch hole (left)",
    waterdrop: "Waterdrop",
    "home-button": "Home button",
    none: "None",
  },
} as const;

const PREVIEW_BOX = { width: 170, height: 250 };

function FieldShell({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11.5px] font-medium text-muted">{label}</span>
      {children}
      {error && <span className="block text-[11px] text-danger">{error}</span>}
    </label>
  );
}

const inputClass =
  "h-9 w-full rounded-full border border-line bg-raised px-3.5 text-[13px] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent";

/** Create or edit a custom device; validated with Zod, with a live frame preview. */
export function CustomDeviceDialog({ dialog }: { dialog: CustomDialog }) {
  const editing = dialog.mode === "edit" ? dialog.device : null;
  const [draft, setDraft] = useState<Draft>(() => (editing ? customDeviceToForm(editing) : EMPTY));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);
  const tone = useSimulatorStore((state) => state.theme);
  const nameRef = useRef<HTMLInputElement>(null);
  const lastPreview = useRef<Device | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") useSimulatorStore.getState().setCustomDialog(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const preview = useMemo(() => {
    const parsed = customDeviceFormSchema.safeParse({ ...draft, name: draft.name || "Preview" });
    if (parsed.success) lastPreview.current = buildCustomDevice(parsed.data, "custom-preview", new Date().getFullYear());
    return lastPreview.current;
  }, [draft]);

  const update = (field: Field, value: string): void => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const parsed = customDeviceFormSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && field in EMPTY && !next[field as Field]) next[field as Field] = issue.message;
      }
      setErrors(next);
      return;
    }
    const store = useSimulatorStore.getState();
    const id = editing?.id ?? newCustomDeviceId(parsed.data.name, Date.now());
    const device = buildCustomDevice(parsed.data, id, editing?.year ?? new Date().getFullYear());
    const list = editing ? store.customDevices.map((item) => (item.id === id ? device : item)) : [...store.customDevices, device];
    setSaving(true);
    try {
      await saveCustomDevices(list);
      store.setCustomDevices(list);
      store.selectDevice(id);
      store.setCustomDialog(null);
      store.showToast("info", editing ? `Saved “${device.name}”.` : `Added “${device.name}”.`);
    } catch (error) {
      store.showToast("error", `Could not save: ${error instanceof Error ? error.message : String(error)}`);
      setSaving(false);
    }
  };

  const previewLayout = preview ? frameLayout(preview, "portrait", BARE_SCREEN) : null;
  const previewScale = previewLayout ? fitScale(previewLayout.outer, PREVIEW_BOX) : 1;

  const select = <K extends "platform" | "kind" | "cutout">(field: K, options: readonly string[]) => (
    <select value={draft[field]} onChange={(event) => update(field, event.target.value)} className={inputClass}>
      {options.map((option) => (
        <option key={option} value={option}>
          {(LABELS[field] as Record<string, string>)[option]}
        </option>
      ))}
    </select>
  );

  return (
    <div
      className="phone-sim-fade fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) useSimulatorStore.getState().setCustomDialog(null);
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit custom device" : "Add a custom device"}
        onSubmit={(event) => void submit(event)}
        className="phone-sim-pop w-[min(640px,100%)] rounded-3xl border border-line bg-panel text-ink"
        noValidate
      >
        <header className="flex items-center justify-between border-b border-line p-4">
          <h2 className="text-[15px] font-semibold">{editing ? "Edit custom device" : "Add a custom device"}</h2>
          <Tip label="Close" keys="Esc" side="left">
            <button
              type="button"
              aria-label="Close"
              onClick={() => useSimulatorStore.getState().setCustomDialog(null)}
              className="grid size-8 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </Tip>
        </header>
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_190px]">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FieldShell label="Name" error={errors.name}>
                <input ref={nameRef} value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="My test phone" className={inputClass} />
              </FieldShell>
            </div>
            <FieldShell label="Width (CSS px, portrait)" error={errors.width}>
              <input inputMode="numeric" value={draft.width} onChange={(event) => update("width", event.target.value)} className={inputClass} />
            </FieldShell>
            <FieldShell label="Height (CSS px)" error={errors.height}>
              <input inputMode="numeric" value={draft.height} onChange={(event) => update("height", event.target.value)} className={inputClass} />
            </FieldShell>
            <FieldShell label="Pixel ratio (DPR)" error={errors.dpr}>
              <input inputMode="decimal" value={draft.dpr} onChange={(event) => update("dpr", event.target.value)} className={inputClass} />
            </FieldShell>
            <FieldShell label="Corner radius (px)" error={errors.screenRadius}>
              <input inputMode="numeric" value={draft.screenRadius} onChange={(event) => update("screenRadius", event.target.value)} className={inputClass} />
            </FieldShell>
            <FieldShell label="Platform" error={errors.platform}>
              {select("platform", platformSchema.options)}
            </FieldShell>
            <FieldShell label="Kind" error={errors.kind}>
              {select("kind", deviceKindSchema.options)}
            </FieldShell>
            <FieldShell label="Camera cutout" error={errors.cutout}>
              {select("cutout", cutoutSchema.options)}
            </FieldShell>
            <FieldShell label="Colour" error={errors.color}>
              <span className="flex h-9 items-center gap-2 rounded-full border border-line bg-raised px-3">
                <input type="color" value={draft.color} onChange={(event) => update("color", event.target.value)} className="h-6 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Colour" />
                <span className="text-[12px] uppercase tabular-nums text-muted">{draft.color}</span>
              </span>
            </FieldShell>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-stage/60 p-3">
            {preview && previewLayout && (
              <div style={{ width: previewLayout.outer.width * previewScale, height: previewLayout.outer.height * previewScale }}>
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: "0 0" }}>
                  <DeviceFrame device={preview} layout={previewLayout} tone={tone}>
                    <div className="h-full w-full" style={{ background: "linear-gradient(160deg, #6a8dff, #c48bff 55%, #ffb3c7)" }} />
                  </DeviceFrame>
                </div>
              </div>
            )}
            <p className="mt-3 text-center text-[11px] text-muted tabular-nums">
              {preview ? `${preview.screen.width} × ${preview.screen.height} @${preview.dpr}x` : "Fix the fields to preview"}
            </p>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-line p-4">
          <button type="button" onClick={() => useSimulatorStore.getState().setCustomDialog(null)} className="h-9 rounded-full px-4 text-[13px] text-muted hover:bg-raised hover:text-ink">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="h-9 rounded-full bg-accent px-5 text-[13px] font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60">
            {editing ? "Save device" : "Add device"}
          </button>
        </footer>
      </form>
    </div>
  );
}

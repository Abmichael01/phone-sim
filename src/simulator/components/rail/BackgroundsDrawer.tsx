import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { MAX_CUSTOM_BACKGROUNDS, type CustomBackground } from "@/schemas/customBackground";
import { compressWallpaperFile, saveCustomBackgrounds } from "@/shared/customBackgrounds";
import { useSimulatorStore } from "@/stores/simulator";
import { STAGE_BACKGROUNDS, stageBackgroundStyle, type StageBackground } from "../../backgrounds";
import { CheckIcon, TrashIcon, UploadIcon } from "../icons";
import { Drawer, Tip } from "../ui";

function Tile({ bg, selected }: { bg: StageBackground; selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => useSimulatorStore.getState().setPreference("stageBg", bg.id)}
      className={`group flex flex-col gap-1.5 rounded-2xl border p-1.5 text-left transition-colors ${
        selected ? "border-accent bg-accent text-accent-ink" : "border-line bg-raised/50 hover:border-ink/20 hover:bg-raised"
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/15" style={stageBackgroundStyle(bg)}>
        {selected && (
          <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-accent text-accent-ink ring-1 ring-white/30">
            <CheckIcon width={11} height={11} />
          </span>
        )}
      </div>
      <span className={`truncate px-1 text-[11.5px] font-medium ${selected ? "text-accent-ink" : "text-muted group-hover:text-ink"}`}>
        {bg.name}
      </span>
    </button>
  );
}

function CustomTile({
  bg,
  selected,
  onDelete,
}: {
  bg: CustomBackground;
  selected: boolean;
  onDelete(): void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => useSimulatorStore.getState().setPreference("stageBg", bg.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          useSimulatorStore.getState().setPreference("stageBg", bg.id);
        }
      }}
      className={`group relative flex cursor-pointer flex-col gap-1.5 rounded-2xl border p-1.5 text-left transition-colors ${
        selected ? "border-accent bg-accent text-accent-ink" : "border-line bg-raised/50 hover:border-ink/20 hover:bg-raised"
      }`}
    >
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/15"
        style={{ backgroundImage: `url("${bg.dataUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {selected && (
          <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-accent text-accent-ink ring-1 ring-white/30">
            <CheckIcon width={11} height={11} />
          </span>
        )}
        <div className="absolute left-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Tip label={`Remove ${bg.name}`} side="top">
            <button
              type="button"
              aria-label={`Remove ${bg.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="grid size-6 place-items-center rounded-full bg-black/75 text-white transition hover:bg-danger"
            >
              <TrashIcon width={12} height={12} />
            </button>
          </Tip>
        </div>
      </div>
      <span className={`truncate px-1 text-[11.5px] font-medium ${selected ? "text-accent-ink" : "text-muted group-hover:text-ink"}`}>
        {bg.name}
      </span>
    </div>
  );
}

/** Left-docked backdrop gallery: local offline image uploads + dark dot grids + curated wallpapers. */
export function BackgroundsDrawer() {
  const current = useSimulatorStore((state) => state.stageBg);
  const customBackgrounds = useSimulatorStore((state) => state.customBackgrounds);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const studio = STAGE_BACKGROUNDS.filter((bg) => bg.group === "studio");
  const wallpapers = STAGE_BACKGROUNDS.filter((bg) => bg.group === "wallpaper");
  const atLimit = customBackgrounds.length >= MAX_CUSTOM_BACKGROUNDS;

  const importFiles = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) return;
    const store = useSimulatorStore.getState();
    const existing = store.customBackgrounds;
    const remaining = MAX_CUSTOM_BACKGROUNDS - existing.length;
    if (remaining <= 0) {
      store.showToast("info", `Up to ${MAX_CUSTOM_BACKGROUNDS} custom photos can be saved locally. Delete one first.`);
      return;
    }

    setBusy(true);
    try {
      const added: CustomBackground[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        added.push(await compressWallpaperFile(file));
      }
      const next = [...added, ...existing].slice(0, MAX_CUSTOM_BACKGROUNDS);
      await saveCustomBackgrounds(next);
      store.setCustomBackgrounds(next);
      if (added[0]) store.setPreference("stageBg", added[0].id);
      store.showToast("info", added.length === 1 ? `Saved “${added[0]!.name}” locally.` : `Saved ${added.length} photos locally.`);
    } catch (error: unknown) {
      store.showToast("error", error instanceof Error ? error.message : "Could not load that image.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeCustom = async (bg: CustomBackground): Promise<void> => {
    const store = useSimulatorStore.getState();
    const next = store.customBackgrounds.filter((item) => item.id !== bg.id);
    try {
      await saveCustomBackgrounds(next);
      store.setCustomBackgrounds(next);
      store.showToast("info", `Removed “${bg.name}”.`);
    } catch (error: unknown) {
      store.showToast("error", `Could not remove: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    void importFiles(event.target.files);
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setDragging(false);
    void importFiles(event.dataTransfer.files);
  };

  return (
    <Drawer label="Stage backgrounds" className="no-scrollbar bottom-2 top-2 w-[332px] space-y-4 overflow-y-auto p-4">
      <div className="space-y-1">
        <h2 className="text-[14px] font-semibold text-ink">Stage background</h2>
        <p className="text-[12px] text-muted">Upload your own photo locally or pick a curated backdrop.</p>
      </div>

      {/* Offline local photo upload (compressed to WebP in-browser, zero server upload) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
            Your Photos {customBackgrounds.length > 0 ? `· ${customBackgrounds.length}/${MAX_CUSTOM_BACKGROUNDS}` : ""}
          </p>
          <span className="text-[10.5px] text-muted">Saved locally</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          aria-label="Upload custom background image"
          onChange={onFileChange}
        />

        <button
          type="button"
          disabled={busy || atLimit}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!atLimit) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex w-full items-center justify-center gap-2 rounded-full border border-dashed px-4 py-2.5 text-[12.5px] font-medium transition-colors disabled:opacity-45 ${
            dragging
              ? "border-accent bg-accent text-accent-ink"
              : "border-line bg-raised/55 text-ink hover:border-accent hover:bg-accent hover:text-accent-ink"
          }`}
        >
          <UploadIcon width={15} height={15} />
          {busy ? "Optimizing locally…" : atLimit ? `Limit reached (${MAX_CUSTOM_BACKGROUNDS} max)` : "Choose or drop image"}
        </button>

        {customBackgrounds.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {customBackgrounds.map((bg) => (
              <CustomTile key={bg.id} bg={bg} selected={bg.id === current} onDelete={() => void removeCustom(bg)} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Dot Grids &amp; Studio</p>
        <div className="grid grid-cols-2 gap-2">
          {studio.map((bg) => (
            <Tile key={bg.id} bg={bg} selected={bg.id === current} />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Dark Wallpapers</p>
        <div className="grid grid-cols-2 gap-2">
          {wallpapers.map((bg) => (
            <Tile key={bg.id} bg={bg} selected={bg.id === current} />
          ))}
        </div>
      </section>
    </Drawer>
  );
}

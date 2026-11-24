import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { brands, DEFAULT_DEVICE_ID, devices, filterDevices, findDevice, formatScreen, groupByBrand, resolveDevice, type BrandGroup, type DeviceFilter } from "@/devices";
import { CUSTOM_BRAND } from "@/schemas/customDevice";
import type { Device } from "@/schemas/device";
import { MAX_STAGE_SLOTS } from "@/schemas/settings";
import { saveCustomDevices } from "@/shared/customDevices";
import { useSimulatorStore, type StagePreset } from "@/stores/simulator";
import { DeviceGlyph } from "../DeviceGlyph";
import { ScrollRow } from "../ScrollRow";
import { ArrowDownIcon, ArrowUpIcon, CloseIcon, ExpandIcon, PencilIcon, PlusIcon, RotateIcon, SearchIcon, TrashIcon } from "../icons";
import { Drawer, Segmented, Tip } from "../ui";

interface Chip {
  label: string;
  filter: DeviceFilter;
}

const BASE_CHIPS: readonly Chip[] = [
  { label: "All", filter: { type: "all" } },
  { label: "Phones", filter: { type: "kind", kind: "phone" } },
  { label: "Tablets", filter: { type: "kind", kind: "tablet" } },
  { label: "Foldables", filter: { type: "kind", kind: "foldable" } },
  ...brands.map((brand): Chip => ({ label: brand, filter: { type: "brand", brand } })),
];

const MODES: readonly { value: "swap" | "add"; label: string }[] = [
  { value: "swap", label: "Swap active" },
  { value: "add", label: "Add to stage" },
];

const PRESETS: readonly { id: StagePreset; label: string }[] = [
  { id: "phone-tablet", label: "Phone + Tab" },
  { id: "two-phones", label: "2 Phones" },
  { id: "single", label: "Single" },
];

const sameFilter = (a: DeviceFilter, b: DeviceFilter): boolean => JSON.stringify(a) === JSON.stringify(b);
const optionId = (section: string, deviceId: string): string => `device-option-${section}-${deviceId}`;

interface Section {
  key: string;
  title: string;
  devices: Device[];
}

/** Tiny CSS outline of the device, to tell shapes apart at a glance. */
function DeviceThumb({ device }: { device: Device }) {
  const height = 28;
  const width = Math.max(12, Math.round((height * device.screen.width) / device.screen.height));
  const radius = Math.max(2, Math.round((device.frame.screenRadius + device.frame.bezel) * (height / device.screen.height)) + 2);
  return (
    <span
      className="relative shrink-0"
      style={{
        width,
        height,
        borderRadius: radius,
        background: "#0b0c10",
        border: `1.5px solid ${device.frame.color}`,
      }}
      aria-hidden="true"
    >
      {device.frame.crease && <span className="absolute inset-y-1 left-1/2 w-px bg-white/20" />}
      {(device.frame.cutout === "dynamic-island" || device.frame.cutout === "notch") && (
        <span className="absolute left-1/2 top-[3px] h-[2px] w-[6px] -translate-x-1/2 rounded-full bg-white/35" />
      )}
    </span>
  );
}

/** Full-height left drawer: manage active stage slots, presets, and search/add/swap any of 189+ devices. */
export function DevicesDrawer({ initialMode }: { initialMode: "swap" | "add" }) {
  const slots = useSimulatorStore((state) => state.slots);
  const activeSlotId = useSimulatorStore((state) => state.activeSlotId);
  const deviceId = useSimulatorStore((state) => state.deviceId);
  const customDevices = useSimulatorStore((state) => state.customDevices);
  const recentIds = useSimulatorStore((state) => state.recentDeviceIds);
  const locked = useSimulatorStore((state) => state.recording.status !== "idle");
  const [mode, setMode] = useState<"swap" | "add">(initialMode);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DeviceFilter>({ type: "all" });
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => searchRef.current?.focus(), []);

  const canAddMore = slots.length < MAX_STAGE_SLOTS;

  const chips = useMemo(
    () => (customDevices.length > 0 ? [...BASE_CHIPS, { label: CUSTOM_BRAND, filter: { type: "brand", brand: CUSTOM_BRAND } } satisfies Chip] : BASE_CHIPS),
    [customDevices.length],
  );

  const sections = useMemo((): Section[] => {
    const all = [...customDevices, ...devices];
    const groups: BrandGroup[] = groupByBrand(filterDevices(all, query, filter));
    const custom = groups.find((group) => group.brand === CUSTOM_BRAND);
    const result: Section[] = [];
    if (!query && filter.type === "all") {
      const recent = recentIds.flatMap((id) => findDevice(id, customDevices) ?? []);
      if (recent.length > 0) result.push({ key: "recent", title: "Recent", devices: recent });
    }
    if (custom) result.push({ key: "custom", title: "Custom", devices: custom.devices });
    for (const group of groups) if (group.brand !== CUSTOM_BRAND) result.push({ key: group.brand, title: group.brand, devices: group.devices });
    return result;
  }, [customDevices, recentIds, query, filter]);

  const flat = useMemo(() => sections.flatMap((section) => section.devices.map((device) => ({ key: optionId(section.key, device.id), device }))), [sections]);
  const active =
    flat.find((item) => item.key === activeKey) ??
    (mode === "swap" ? flat.find((item) => item.device.id === deviceId) : undefined) ??
    flat[0] ??
    null;

  useEffect(() => {
    if (active && (activeKey !== null || mode === "swap")) {
      document.getElementById(active.key)?.scrollIntoView({ block: "nearest" });
    }
  }, [active, activeKey, mode]);

  const choose = (device: Device): void => {
    if (locked) return;
    const store = useSimulatorStore.getState();
    if (mode === "add") {
      if (!canAddMore) {
        store.showToast("info", `Stage is full (${MAX_STAGE_SLOTS} devices max). Remove one or switch to Swap.`);
        return;
      }
      store.addDevice(device.id);
      store.setPanel(null);
      return;
    }
    store.selectDevice(device.id);
    store.setPanel(null);
  };

  const removeCustom = (device: Device): void => {
    const store = useSimulatorStore.getState();
    const next = store.customDevices.filter((item) => item.id !== device.id);
    saveCustomDevices(next)
      .then(() => {
        store.setCustomDevices(next);
        store.showToast("info", `Deleted “${device.name}”.`);
      })
      .catch((error: unknown) => store.showToast("error", `Could not delete: ${error instanceof Error ? error.message : String(error)}`));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (flat.length === 0) return;
    const index = Math.max(0, flat.findIndex((item) => item.key === active?.key));
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = flat[Math.min(flat.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)))];
      if (next) setActiveKey(next.key);
    } else if (event.key === "Enter" && active) {
      event.preventDefault();
      choose(active.device);
    }
  };

  return (
    <Drawer label="Devices & stage" className="bottom-2 top-2 flex w-[360px] flex-col overflow-hidden">
      {/* Stage slots + quick presets */}
      <div className="space-y-2.5 border-b border-line p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            On stage · {slots.length}/{MAX_STAGE_SLOTS}
          </p>
          <div className="flex items-center gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={locked}
                onClick={() => useSimulatorStore.getState().applyPreset(preset.id)}
                className="rounded-full bg-raised px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:text-ink disabled:opacity-40"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          {slots.map((slot, index) => {
            const dev = findDevice(slot.deviceId, customDevices) ?? resolveDevice(DEFAULT_DEVICE_ID);
            const isCurrent = slot.slotId === activeSlotId;
            return (
              <div
                key={slot.slotId}
                onClick={() => useSimulatorStore.getState().setActiveSlot(slot.slotId)}
                className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
                  isCurrent ? "bg-accent text-accent-ink" : "bg-raised/60 text-muted hover:bg-raised hover:text-ink"
                }`}
              >
                <span className={`size-1.5 shrink-0 rounded-full ${isCurrent ? "bg-white" : "bg-muted/35"}`} />
                <DeviceGlyph device={dev} size={13} />
                <span className={`min-w-0 flex-1 truncate ${isCurrent ? "font-semibold" : ""}`}>{dev.name}</span>
                <span className={`shrink-0 text-[11px] tabular-nums ${isCurrent ? "text-white/80" : "text-muted"}`}>
                  {slot.orientation === "portrait" ? `${dev.screen.width}×${dev.screen.height}` : `${dev.screen.height}×${dev.screen.width}`}
                </span>
                {!locked && (
                  <span className="flex shrink-0 items-center gap-0.5">
                    {slots.length > 1 && (
                      <>
                        <Tip label="Move left" side="top" disabled={index === 0}>
                          <button
                            type="button"
                            aria-label={`Move ${dev.name} left`}
                            disabled={index === 0}
                            onClick={(event) => {
                              event.stopPropagation();
                              useSimulatorStore.getState().reorderSlot(slot.slotId, -1);
                            }}
                            className={`grid size-6 place-items-center rounded-full disabled:opacity-30 ${
                              isCurrent ? "text-white/80 hover:bg-white/15 hover:text-white" : "text-muted hover:bg-raised hover:text-ink"
                            }`}
                          >
                            <ArrowUpIcon width={12} height={12} />
                          </button>
                        </Tip>
                        <Tip label="Move right" side="top" disabled={index === slots.length - 1}>
                          <button
                            type="button"
                            aria-label={`Move ${dev.name} right`}
                            disabled={index === slots.length - 1}
                            onClick={(event) => {
                              event.stopPropagation();
                              useSimulatorStore.getState().reorderSlot(slot.slotId, 1);
                            }}
                            className={`grid size-6 place-items-center rounded-full disabled:opacity-30 ${
                              isCurrent ? "text-white/80 hover:bg-white/15 hover:text-white" : "text-muted hover:bg-raised hover:text-ink"
                            }`}
                          >
                            <ArrowDownIcon width={12} height={12} />
                          </button>
                        </Tip>
                        <Tip label={`Solo focus ${dev.name}`} side="top">
                          <button
                            type="button"
                            aria-label={`Solo ${dev.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              useSimulatorStore.getState().toggleSoloSlot(slot.slotId);
                              useSimulatorStore.getState().setPanel(null);
                            }}
                            className={`grid size-6 place-items-center rounded-full ${
                              isCurrent ? "text-white/80 hover:bg-white/15 hover:text-white" : "text-muted hover:bg-raised hover:text-ink"
                            }`}
                          >
                            <ExpandIcon width={12} height={12} />
                          </button>
                        </Tip>
                      </>
                    )}
                    <Tip label={`Rotate ${dev.name}`} side="top">
                      <button
                        type="button"
                        aria-label={`Rotate ${dev.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          useSimulatorStore.getState().rotate(slot.slotId);
                        }}
                        className={`grid size-6 place-items-center rounded-full ${
                          isCurrent ? "text-white/80 hover:bg-white/15 hover:text-white" : "text-muted hover:bg-raised hover:text-ink"
                        }`}
                      >
                        <RotateIcon width={13} height={13} />
                      </button>
                    </Tip>
                    {slots.length > 1 && (
                      <Tip label={`Remove ${dev.name}`} side="top">
                        <button
                          type="button"
                          aria-label={`Remove ${dev.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            useSimulatorStore.getState().removeSlot(slot.slotId);
                          }}
                          className={`grid size-6 place-items-center rounded-full ${
                            isCurrent ? "text-white/80 hover:bg-white/15 hover:text-white" : "text-muted hover:bg-danger/15 hover:text-danger"
                          }`}
                        >
                          <CloseIcon width={13} height={13} />
                        </button>
                      </Tip>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode toggle + search + brand/kind filters */}
      <div className="space-y-2.5 border-b border-line p-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Segmented<"swap" | "add"> label="Picker mode" value={mode} options={MODES} onChange={setMode} />
          </div>
          <Tip label="Create a custom device" side="top">
            <button
              type="button"
              onClick={() => useSimulatorStore.getState().setCustomDialog({ mode: "create" })}
              className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-line bg-raised px-3 text-xs font-medium text-ink transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
            >
              <PlusIcon width={13} height={13} />
              Custom
            </button>
          </Tip>
        </div>

        <label className="flex h-9 items-center gap-2 rounded-full bg-raised px-3.5 text-muted focus-within:ring-2 focus-within:ring-accent">
          <SearchIcon width={15} height={15} />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveKey(null);
            }}
            onKeyDown={onKeyDown}
            placeholder={mode === "add" ? `Add from ${devices.length + customDevices.length} devices…` : `Search ${devices.length + customDevices.length} devices`}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
            role="combobox"
            aria-expanded="true"
            aria-controls="device-list"
            aria-activedescendant={active?.key}
            aria-label="Search devices"
          />
        </label>

        <div className="-mx-3">
          <ScrollRow label="Device filters" className="gap-1.5 px-3" selectionKey={JSON.stringify(filter)}>
          {chips.map((chip) => {
            const selected = sameFilter(chip.filter, filter);
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setFilter(chip.filter);
                  setActiveKey(null);
                }}
                aria-pressed={selected}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                  selected ? "bg-accent text-accent-ink" : "bg-raised text-muted hover:text-ink"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
          </ScrollRow>
        </div>
      </div>

      {locked && <p className="mx-3 mt-3 rounded-lg bg-danger/12 p-2.5 text-xs text-danger">Stop recording to change devices.</p>}
      {mode === "add" && !canAddMore && (
        <p className="mx-3 mt-3 rounded-lg bg-raised p-2.5 text-xs text-muted">
          Stage is at the {MAX_STAGE_SLOTS}-device limit. Remove a device above or switch to Swap active.
        </p>
      )}

      <div id="device-list" role="listbox" aria-label="Devices" className="no-scrollbar flex-1 overflow-y-auto p-2">
        {sections.length === 0 && <p className="p-6 text-center text-[13px] text-muted">No devices match “{query}”.</p>}
        {sections.map((section) => (
          <div key={section.key} role="group" aria-label={section.title} className="mb-1">
            <p className="sticky top-0 z-10 bg-panel p-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted">{section.title}</p>
            {section.devices.map((device) => {
              const key = optionId(section.key, device.id);
              const selected = mode === "swap" && device.id === deviceId;
              const isCustom = device.brand === CUSTOM_BRAND;
              const disabled = locked || (mode === "add" && !canAddMore);
              return (
                <div
                  key={key}
                  id={key}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={disabled}
                  onClick={() => choose(device)}
                  onMouseMove={() => active?.key !== key && setActiveKey(key)}
                  className={`group flex scroll-mt-9 cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors ${
                    selected ? "bg-accent text-accent-ink" : active?.key === key ? "bg-raised" : ""
                  } ${disabled && !selected ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  <DeviceThumb device={device} />
                  <span className="min-w-0 flex-1">
                    <span className={`flex items-center gap-1.5 truncate text-[13px] ${selected ? "font-semibold" : ""}`}>
                      <DeviceGlyph device={device} size={12} />
                      {device.name}
                    </span>
                    <span className={`block text-[11px] tabular-nums ${selected ? "text-white/80" : "text-muted"}`}>{formatScreen(device)}</span>
                  </span>
                  {device.approx && (
                    <Tip label="Approximate specs: best-known estimate" side="top">
                      <span className={`shrink-0 rounded-full px-1.5 text-[11px] ${selected ? "bg-white/20 text-white" : "bg-raised text-muted"}`}>
                        ≈
                      </span>
                    </Tip>
                  )}
                  {mode === "add" && canAddMore && (
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition group-hover:brightness-110" aria-hidden="true">
                      <PlusIcon width={13} height={13} />
                    </span>
                  )}
                  {isCustom && section.key === "custom" && (
                    <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-aria-selected:opacity-100">
                      <Tip label={`Edit ${device.name}`} side="top">
                        <button
                          type="button"
                          aria-label={`Edit ${device.name}`}
                          className="grid size-7 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"
                          onClick={(event) => {
                            event.stopPropagation();
                            useSimulatorStore.getState().setCustomDialog({ mode: "edit", device });
                          }}
                        >
                          <PencilIcon width={14} height={14} />
                        </button>
                      </Tip>
                      <Tip label={`Delete ${device.name}`} side="top">
                        <button
                          type="button"
                          aria-label={`Delete ${device.name}`}
                          className="grid size-7 place-items-center rounded-full text-muted hover:bg-danger/15 hover:text-danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeCustom(device);
                          }}
                        >
                          <TrashIcon width={14} height={14} />
                        </button>
                      </Tip>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Drawer>
  );
}

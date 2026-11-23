import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { brands, devices, filterDevices, formatScreen, groupByBrand, type DeviceFilter } from "@/devices";
import type { Device } from "@/schemas/device";
import { useSimulatorStore } from "@/stores/simulator";
import { SearchIcon } from "./icons";

interface Chip {
  label: string;
  filter: DeviceFilter;
}

const CHIPS: readonly Chip[] = [
  { label: "All", filter: { type: "all" } },
  { label: "Phones", filter: { type: "kind", kind: "phone" } },
  { label: "Tablets", filter: { type: "kind", kind: "tablet" } },
  { label: "Foldables", filter: { type: "kind", kind: "foldable" } },
  ...brands.map((brand): Chip => ({ label: brand, filter: { type: "brand", brand } })),
];

const sameFilter = (a: DeviceFilter, b: DeviceFilter): boolean => JSON.stringify(a) === JSON.stringify(b);
const optionId = (deviceId: string): string => `device-option-${deviceId}`;

/** Tiny CSS outline of the device, to tell shapes apart at a glance. */
function DeviceThumb({ device }: { device: Device }) {
  const height = 30;
  const width = Math.max(12, Math.round((height * device.screen.width) / device.screen.height));
  const radius = Math.max(2, Math.round((device.frame.screenRadius + device.frame.bezel) * (height / device.screen.height)) + 2);
  return (
    <span
      className="relative shrink-0 bg-[#0b0c10]"
      style={{ width, height, borderRadius: radius, boxShadow: `inset 0 0 0 1.5px ${device.frame.color}` }}
      aria-hidden="true"
    >
      {device.frame.crease && <span className="absolute inset-y-1 left-1/2 w-px bg-white/20" />}
      {(device.frame.cutout === "dynamic-island" || device.frame.cutout === "notch") && (
        <span className="absolute left-1/2 top-[3px] h-[2px] w-[6px] -translate-x-1/2 rounded-full bg-white/35" />
      )}
    </span>
  );
}

/** Searchable, filterable device list grouped by brand, newest first. */
export function DevicePicker() {
  const deviceId = useSimulatorStore((state) => state.deviceId);
  const locked = useSimulatorStore((state) => state.recording.status !== "idle");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DeviceFilter>({ type: "all" });
  const [activeId, setActiveId] = useState<string | null>(null);

  const groups = useMemo(() => groupByBrand(filterDevices(devices, query, filter)), [query, filter]);
  const flat = useMemo(() => groups.flatMap((group) => group.devices), [groups]);
  const active =
    flat.find((device) => device.id === activeId)?.id ?? flat.find((device) => device.id === deviceId)?.id ?? flat[0]?.id ?? null;

  useEffect(() => {
    if (active) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (id: string): void => {
    if (locked) return;
    setActiveId(id);
    useSimulatorStore.getState().selectDevice(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (flat.length === 0) return;
    const index = Math.max(0, flat.findIndex((device) => device.id === active));
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = flat[Math.min(flat.length - 1, Math.max(0, index + step))];
      if (next) setActiveId(next.id);
    } else if (event.key === "Enter" && active) {
      event.preventDefault();
      choose(active);
    }
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-line bg-app" aria-label="Devices">
      <div className="space-y-2.5 border-b border-line p-3">
        <label className="flex h-9 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-muted focus-within:border-accent">
          <SearchIcon width={16} height={16} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveId(null);
            }}
            onKeyDown={onKeyDown}
            placeholder={`Search ${devices.length} devices`}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
            role="combobox"
            aria-expanded="true"
            aria-controls="device-list"
            aria-activedescendant={active ? optionId(active) : undefined}
            aria-label="Search devices"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((chip) => {
            const selected = sameFilter(chip.filter, filter);
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setFilter(chip.filter);
                  setActiveId(null);
                }}
                aria-pressed={selected}
                className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${
                  selected ? "bg-accent text-accent-ink" : "bg-panel text-muted hover:bg-raised hover:text-ink"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {locked && (
        <p className="mx-3 mt-3 rounded-lg bg-danger/12 px-3 py-2 text-xs text-danger">Stop recording to switch devices.</p>
      )}

      <div id="device-list" role="listbox" aria-label="Devices" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2">
        {groups.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-muted">No devices match “{query}”.</p>}
        {groups.map((group) => (
          <div key={group.brand} role="group" aria-label={group.brand} className="mb-2">
            <p className="sticky top-0 z-10 bg-app/95 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted backdrop-blur">
              {group.brand}
            </p>
            {group.devices.map((device) => {
              const selected = device.id === deviceId;
              const isActive = device.id === active;
              return (
                <div
                  key={device.id}
                  id={optionId(device.id)}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={locked}
                  onClick={() => choose(device.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 ${
                    selected ? "bg-accent/15" : isActive ? "bg-raised" : "hover:bg-panel"
                  } ${locked && !selected ? "cursor-not-allowed opacity-45" : ""}`}
                  title={locked ? "Stop recording to switch devices" : undefined}
                >
                  <DeviceThumb device={device} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[13px] ${selected ? "font-semibold text-ink" : "text-ink"}`}>{device.name}</span>
                    <span className="block text-[11px] text-muted tabular-nums">{formatScreen(device)}</span>
                  </span>
                  {device.approx && (
                    <span className="shrink-0 text-[13px] text-muted" title="Approximate specs: best-known estimate">
                      ≈
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}

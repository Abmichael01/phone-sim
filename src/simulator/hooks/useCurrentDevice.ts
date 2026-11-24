import { useMemo } from "react";
import { DEFAULT_DEVICE_ID, findDevice, resolveDevice, withFinish } from "@/devices";
import type { Device } from "@/schemas/device";
import { useSimulatorStore } from "@/stores/simulator";

/** The selected device (catalog or custom), drawn in the finish saved for it. */
export function useCurrentDevice(): Device {
  const deviceId = useSimulatorStore((state) => state.deviceId);
  const customDevices = useSimulatorStore((state) => state.customDevices);
  const finishName = useSimulatorStore((state) => state.finishes[state.deviceId]);
  return useMemo(() => {
    const device = findDevice(deviceId, customDevices) ?? resolveDevice(DEFAULT_DEVICE_ID);
    return withFinish(device, finishName);
  }, [deviceId, customDevices, finishName]);
}

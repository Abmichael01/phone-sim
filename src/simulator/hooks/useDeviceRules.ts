import { useEffect } from "react";
import { requestApplyDevice } from "@/shared/messages";
import { useSimulatorStore } from "@/stores/simulator";

/**
 * Whenever the device changes, asks the background to point this tab's header
 * rules at it. The frame only loads once the rules for the current device are
 * active, so the first request already carries the device's User-Agent.
 */
export function useDeviceRules(): void {
  const deviceId = useSimulatorStore((state) => state.deviceId);

  useEffect(() => {
    let current = true;
    const { setRulesDevice, showToast } = useSimulatorStore.getState();
    setRulesDevice(null);
    requestApplyDevice(deviceId)
      .then((response) => {
        if (!current) return;
        if (!response.ok) showToast("error", `Device headers not applied: ${response.error}`);
        setRulesDevice(deviceId);
      })
      .catch((error: unknown) => {
        if (!current) return;
        showToast("error", `Device headers not applied: ${error instanceof Error ? error.message : String(error)}`);
        setRulesDevice(deviceId);
      });
    return () => {
      current = false;
    };
  }, [deviceId]);
}

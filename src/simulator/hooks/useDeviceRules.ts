import { useEffect } from "react";
import type { Device } from "@/schemas/device";
import { requestApplyDevice } from "@/shared/messages";
import { useSimulatorStore } from "@/stores/simulator";

/**
 * Points this tab's header rules at the active device. Marks `rulesReady` once
 * the initial rule update finishes so frames only mount after framing headers
 * are stripped, while later focus switches update headers without unmounting
 * sibling devices on stage.
 */
export function useDeviceRules(device: Device): void {
  const { id, platform, kind, osVersion, userAgent } = device;
  useEffect(() => {
    let current = true;
    const { setRulesReady, showToast } = useSimulatorStore.getState();
    const finish = (error: string | null): void => {
      if (!current) return;
      if (error) showToast("error", `Device headers not applied: ${error}`);
      setRulesReady(true);
    };
    requestApplyDevice(id)
      .then((response) => finish(response.ok ? null : response.error))
      .catch((error: unknown) => finish(error instanceof Error ? error.message : String(error)));
    return () => {
      current = false;
    };
  }, [id, platform, kind, osVersion, userAgent]);
}

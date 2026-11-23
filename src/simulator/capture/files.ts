const pad = (value: number): string => String(value).padStart(2, "0");

/** Local time as YYYYMMDD-HHMMSS. */
export function fileTimestamp(date: Date): string {
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${day}-${time}`;
}

/** phone-sim-<device-id>-<YYYYMMDD-HHMMSS>.<ext> */
export function captureFileName(deviceId: string, date: Date, extension: string): string {
  return `phone-sim-${deviceId}-${fileTimestamp(date)}.${extension}`;
}

/** Saves a blob through a temporary <a download>. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.click();
  // The download has started once click() returns; give the browser a moment before releasing.
  window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

import type { CaptureQuality } from "@/schemas/settings";
import { qualityProfile, targetCaptureDimensions } from "./quality";

export interface RecordingFormat {
  /** Empty string lets the browser pick its default container. */
  mimeType: string;
  extension: "mp4" | "webm";
}

const FORMAT_PREFERENCE: readonly RecordingFormat[] = [
  { mimeType: "video/mp4;codecs=avc1.640034", extension: "mp4" },
  { mimeType: "video/mp4;codecs=avc1", extension: "mp4" },
  { mimeType: "video/webm;codecs=vp9", extension: "webm" },
  { mimeType: "video/webm", extension: "webm" },
];

export function pickRecordingFormat(isSupported: (mimeType: string) => boolean): RecordingFormat {
  return FORMAT_PREFERENCE.find((format) => isSupported(format.mimeType)) ?? { mimeType: "", extension: "webm" };
}

export interface RecordingResult {
  blob: Blob;
  extension: RecordingFormat["extension"];
}

export interface RecorderCallbacks {
  /** Called once when recording ends (Stop pressed or sharing ended). */
  onFinish(result: RecordingResult): void;
  onError(message: string): void;
}

const SELF_TAB_HINT = "Choose this tab (“Phone Sim”) in the share dialog so the device can be recorded.";

function settleFrames(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

function setDetailHint(track: MediaStreamTrack | undefined): void {
  if (track && "contentHint" in track) {
    try {
      track.contentHint = "detail";
    } catch {
      // Ignore on engines where contentHint is read-only.
    }
  }
}

/**
 * Records one element of this tab at the chosen quality preset (720p / 1080p / 2K / Native):
 * uses Region Capture first when available, and scales to exact even target dimensions
 * (e.g. 1080p @ 60 fps / 16 Mbps) with high-quality filtering.
 */
export class ElementRecorder {
  private readonly cleanups: Array<() => void> = [];
  private recorder: MediaRecorder | null = null;
  private finished = false;

  private constructor(
    private readonly quality: CaptureQuality,
    private readonly callbacks: RecorderCallbacks,
  ) {}

  /** Must be called straight from a user gesture (getDisplayMedia requires it). */
  static async start(element: HTMLElement, quality: CaptureQuality, callbacks: RecorderCallbacks): Promise<ElementRecorder> {
    const session = new ElementRecorder(quality, callbacks);
    try {
      await session.begin(element);
      return session;
    } catch (error) {
      session.dispose();
      throw error;
    }
  }

  stop(): void {
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    else this.dispose();
  }

  private async begin(element: HTMLElement): Promise<void> {
    const profile = qualityProfile(this.quality);
    const options: DisplayMediaStreamOptions = {
      video: { frameRate: { ideal: profile.fps, max: profile.fps } },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: "include",
    };
    const stream = await navigator.mediaDevices.getDisplayMedia(options);
    this.cleanups.push(() => stream.getTracks().forEach((track) => track.stop()));
    const [track] = stream.getVideoTracks();
    if (!track) throw new Error("The shared screen has no video.");
    setDetailHint(track);
    track.addEventListener("ended", () => this.stop());

    // Ensure promoted full-HD layout has settled before locking the crop target.
    await settleFrames();
    const recordStream = await this.croppedStream(element, stream, track, profile.fps);
    const format = pickRecordingFormat((mimeType) => MediaRecorder.isTypeSupported(mimeType));
    const recorderOptions: MediaRecorderOptions = {
      videoBitsPerSecond: profile.bitrate,
      ...(format.mimeType ? { mimeType: format.mimeType } : {}),
    };
    const recorder = new MediaRecorder(recordStream, recorderOptions);
    const chunks: Blob[] = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      const type = recorder.mimeType || format.mimeType || "video/webm";
      this.finish(() => this.callbacks.onFinish({ blob: new Blob(chunks, { type }), extension: format.extension }));
    });
    recorder.addEventListener("error", () => this.finish(() => this.callbacks.onError("Recording failed.")));
    this.recorder = recorder;
    recorder.start(1000);
  }

  private async croppedStream(
    element: HTMLElement,
    stream: MediaStream,
    track: MediaStreamTrack,
    fps: number,
  ): Promise<MediaStream> {
    if (CropTarget && track.cropTo) {
      const target = await CropTarget.fromElement(element);
      try {
        await track.cropTo(target);
      } catch {
        throw new Error(SELF_TAB_HINT);
      }
      if (this.quality === "native") return stream;
      return this.canvasScale(stream, fps);
    }
    if (track.getSettings().displaySurface !== "browser") throw new Error(SELF_TAB_HINT);
    return this.canvasCrop(element, stream, fps);
  }

  /** Scales a Region-Captured video stream cleanly to exact even target dimensions (720p / 1080p / 2K). */
  private async canvasScale(stream: MediaStream, fps: number): Promise<MediaStream> {
    const video = document.createElement("video");
    video.muted = true;
    video.srcObject = stream;
    await video.play();
    this.cleanups.push(() => {
      video.pause();
      video.srcObject = null;
    });

    const out = targetCaptureDimensions(video.videoWidth, video.videoHeight, this.quality, true);
    const canvas = document.createElement("canvas");
    canvas.width = out.width;
    canvas.height = out.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    let frameRequest = 0;
    const draw = (): void => {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);
      frameRequest = video.requestVideoFrameCallback(draw);
    };
    draw();
    this.cleanups.push(() => video.cancelVideoFrameCallback(frameRequest));

    const canvasStream = canvas.captureStream(fps);
    setDetailHint(canvasStream.getVideoTracks()[0]);
    this.cleanups.push(() => canvasStream.getTracks().forEach((t) => t.stop()));
    return canvasStream;
  }

  /** Fallback without Region Capture: crops element bounds and outputs at the chosen quality preset. */
  private async canvasCrop(element: HTMLElement, stream: MediaStream, fps: number): Promise<MediaStream> {
    const video = document.createElement("video");
    video.muted = true;
    video.srcObject = stream;
    await video.play();
    this.cleanups.push(() => {
      video.pause();
      video.srcObject = null;
    });

    const start = element.getBoundingClientRect();
    const startRatio = video.videoWidth / window.innerWidth;
    const out = targetCaptureDimensions(start.width * startRatio, start.height * startRatio, this.quality, true);
    const canvas = document.createElement("canvas");
    canvas.width = out.width;
    canvas.height = out.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    let frameRequest = 0;
    const draw = (): void => {
      const rect = element.getBoundingClientRect();
      const ratio = video.videoWidth / window.innerWidth;
      context.fillStyle = "#000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, rect.left * ratio, rect.top * ratio, rect.width * ratio, rect.height * ratio, 0, 0, canvas.width, canvas.height);
      frameRequest = video.requestVideoFrameCallback(draw);
    };
    draw();
    this.cleanups.push(() => video.cancelVideoFrameCallback(frameRequest));

    const canvasStream = canvas.captureStream(fps);
    setDetailHint(canvasStream.getVideoTracks()[0]);
    this.cleanups.push(() => canvasStream.getTracks().forEach((t) => t.stop()));
    return canvasStream;
  }

  private finish(report: () => void): void {
    if (this.finished) return;
    this.finished = true;
    this.dispose();
    report();
  }

  private dispose(): void {
    while (this.cleanups.length > 0) this.cleanups.pop()?.();
  }
}

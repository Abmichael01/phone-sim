export interface RecordingFormat {
  /** Empty string lets the browser pick its default container. */
  mimeType: string;
  extension: "mp4" | "webm";
}

const FORMAT_PREFERENCE: readonly RecordingFormat[] = [
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

const FRAME_RATE = 30;
const SELF_TAB_HINT = "Choose this tab (“Phone Sim”) in the share dialog so the device can be recorded.";

/**
 * Records one element of this tab: tab capture cropped with Region Capture
 * when available, otherwise the captured video is cropped onto a canvas.
 */
export class ElementRecorder {
  private readonly cleanups: Array<() => void> = [];
  private recorder: MediaRecorder | null = null;
  private finished = false;

  private constructor(private readonly callbacks: RecorderCallbacks) {}

  /** Must be called straight from a user gesture (getDisplayMedia requires it). */
  static async start(element: HTMLElement, callbacks: RecorderCallbacks): Promise<ElementRecorder> {
    const session = new ElementRecorder(callbacks);
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
    const options: DisplayMediaStreamOptions = {
      video: { frameRate: FRAME_RATE },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: "include",
    };
    const stream = await navigator.mediaDevices.getDisplayMedia(options);
    this.cleanups.push(() => stream.getTracks().forEach((track) => track.stop()));
    const [track] = stream.getVideoTracks();
    if (!track) throw new Error("The shared screen has no video.");
    track.addEventListener("ended", () => this.stop());

    const recordStream = await this.croppedStream(element, stream, track);
    const format = pickRecordingFormat((mimeType) => MediaRecorder.isTypeSupported(mimeType));
    const recorder = new MediaRecorder(recordStream, format.mimeType ? { mimeType: format.mimeType } : {});
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

  private async croppedStream(element: HTMLElement, stream: MediaStream, track: MediaStreamTrack): Promise<MediaStream> {
    if (CropTarget && track.cropTo) {
      const target = await CropTarget.fromElement(element);
      try {
        await track.cropTo(target);
      } catch {
        throw new Error(SELF_TAB_HINT);
      }
      return stream;
    }
    if (track.getSettings().displaySurface !== "browser") throw new Error(SELF_TAB_HINT);
    return this.canvasCrop(element, stream);
  }

  /** Fallback without Region Capture: draw the element's area of each frame onto a canvas. */
  private async canvasCrop(element: HTMLElement, stream: MediaStream): Promise<MediaStream> {
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
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(start.width * startRatio));
    canvas.height = Math.max(2, Math.round(start.height * startRatio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available.");

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

    const canvasStream = canvas.captureStream(FRAME_RATE);
    this.cleanups.push(() => canvasStream.getTracks().forEach((track) => track.stop()));
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

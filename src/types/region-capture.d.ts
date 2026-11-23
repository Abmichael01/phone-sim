/**
 * Region Capture (Chromium 104+) and the Chromium getDisplayMedia hints
 * `preferCurrentTab` / `selfBrowserSurface`, which the bundled DOM typings do not describe yet.
 * CropTarget is declared as possibly undefined so callers must feature-check.
 */
interface CropTarget {
  readonly __cropTargetBrand: never;
}

interface CropTargetConstructor {
  fromElement(element: Element): Promise<CropTarget>;
}

declare var CropTarget: CropTargetConstructor | undefined;

interface MediaStreamTrack {
  cropTo?(target: CropTarget | null): Promise<void>;
}

interface DisplayMediaStreamOptions {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: "include" | "exclude";
}

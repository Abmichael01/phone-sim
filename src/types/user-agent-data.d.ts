/** User-Agent Client Hints JS API (Chromium), missing from the bundled DOM typings. */
interface NavigatorUABrandVersion {
  readonly brand: string;
  readonly version: string;
}

interface UADataValues {
  readonly architecture?: string;
  readonly bitness?: string;
  readonly brands?: readonly NavigatorUABrandVersion[];
  readonly fullVersionList?: readonly NavigatorUABrandVersion[];
  readonly mobile?: boolean;
  readonly model?: string;
  readonly platform?: string;
  readonly platformVersion?: string;
  readonly uaFullVersion?: string;
  readonly wow64?: boolean;
}

interface UALowEntropyJSON {
  readonly brands: readonly NavigatorUABrandVersion[];
  readonly mobile: boolean;
  readonly platform: string;
}

interface NavigatorUAData {
  readonly brands: readonly NavigatorUABrandVersion[];
  readonly mobile: boolean;
  readonly platform: string;
  getHighEntropyValues(hints: string[]): Promise<UADataValues>;
  toJSON(): UALowEntropyJSON;
}

interface Navigator {
  readonly userAgentData?: NavigatorUAData;
}

interface WorkerNavigator {
  readonly userAgentData?: NavigatorUAData;
}

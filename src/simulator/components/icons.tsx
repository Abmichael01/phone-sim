import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp02Icon,
  BookOpen01Icon,
  Camera01Icon,
  Cancel01Icon,
  Delete02Icon,
  FullScreenIcon,
  Globe02Icon,
  Home01Icon,
  Image02Icon,
  Link02Icon,
  LinkSquare02Icon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  Refresh01Icon,
  ScreenRotationIcon,
  Search01Icon,
  Settings01Icon,
  Share03Icon,
  SquareLock01Icon,
  TabletSmartphoneIcon,
  Tick02Icon,
  Upload01Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode, SVGProps } from "react";

/**
 * Icon set for the simulator UI: Hugeicons "Stroke Rounded" (free set, MIT
 * licence) for a soft, rounded look. The few glyphs it has no good match for
 * are drawn here on the same 24×24 grid and stroke style. Every export keeps
 * the same name and props (`width` / `height` / `strokeWidth` / `className`),
 * so callers never import the icon library directly and the whole set can be
 * swapped in this one file.
 */
type IconProps = SVGProps<SVGSVGElement>;

const DEFAULT_SIZE = 20;
const STROKE = 1.6;

function toNumber(value: string | number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fromHuge(glyph: IconSvgElement, name: string) {
  const Wrapped = ({ width, height, strokeWidth, ref: _ref, ...props }: IconProps) => (
    <HugeiconsIcon
      icon={glyph}
      size={toNumber(width ?? height, DEFAULT_SIZE)}
      strokeWidth={toNumber(strokeWidth, STROKE)}
      color="currentColor"
      aria-hidden="true"
      {...props}
    />
  );
  Wrapped.displayName = `Icon(${name})`;
  return Wrapped;
}

/** Base for the custom glyphs below, matching the library's look. */
function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={DEFAULT_SIZE}
      height={DEFAULT_SIZE}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

// Rail / toolbar
export const ReloadIcon = fromHuge(Refresh01Icon, "Reload");
export const ExternalIcon = fromHuge(LinkSquare02Icon, "External");
export const RotateIcon = fromHuge(ScreenRotationIcon, "Rotate");
export const CameraIcon = fromHuge(Camera01Icon, "Camera");
export const RecordIcon = fromHuge(Video01Icon, "Record");
export const GearIcon = fromHuge(Settings01Icon, "Gear");
export const CloseIcon = fromHuge(Cancel01Icon, "Close");
export const PlusIcon = fromHuge(Add01Icon, "Plus");
export const DevicesIcon = fromHuge(TabletSmartphoneIcon, "Devices");
export const SyncScrollIcon = fromHuge(Link02Icon, "SyncScroll");
export const BackdropIcon = fromHuge(Image02Icon, "Backdrop");
export const ExpandIcon = fromHuge(FullScreenIcon, "Expand");

// General
export const ChevronDownIcon = fromHuge(ArrowDown01Icon, "ChevronDown");
export const SearchIcon = fromHuge(Search01Icon, "Search");
export const CheckIcon = fromHuge(Tick02Icon, "Check");
export const GlobeIcon = fromHuge(Globe02Icon, "Globe");
export const PencilIcon = fromHuge(PencilEdit02Icon, "Pencil");
export const TrashIcon = fromHuge(Delete02Icon, "Trash");
export const ArrowUpIcon = fromHuge(ArrowUp02Icon, "ArrowUp");
export const ArrowDownIcon = fromHuge(ArrowDown02Icon, "ArrowDown");
export const UploadIcon = fromHuge(Upload01Icon, "Upload");

// In-phone browser bars (Safari / Chrome)
export const ChevronLeftIcon = fromHuge(ArrowLeft01Icon, "ChevronLeft");
export const ChevronRightIcon = fromHuge(ArrowRight01Icon, "ChevronRight");
export const ShareIcon = fromHuge(Share03Icon, "Share");
export const MoreIcon = fromHuge(MoreHorizontalIcon, "More");
export const KebabIcon = fromHuge(MoreVerticalIcon, "Kebab");
export const LockIcon = fromHuge(SquareLock01Icon, "Lock");
export const HomeIcon = fromHuge(Home01Icon, "Home");
export const BookIcon = fromHuge(BookOpen01Icon, "Book");

/** Solid stop square for the recording control. */
export const StopIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor" stroke="none" />
  </Icon>
);

/** Tab switcher square with a count inside (Safari / Chrome style). */
export const TabsIcon = ({ count = 1, ...props }: IconProps & { count?: number }) => (
  <Icon {...props}>
    <rect x="4.5" y="4.5" width="15" height="15" rx="4" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="10"
      fontWeight="600"
      fill="currentColor"
      stroke="none"
      fontFamily="system-ui, sans-serif"
    >
      {count}
    </text>
  </Icon>
);

/** Phone Sim's own mark: a phone beside a tablet, for the top of the rail. */
export const BrandMarkIcon = (props: IconProps) => (
  <Icon {...props} strokeWidth={2}>
    <rect x="3" y="4.5" width="8.5" height="15" rx="2.4" />
    <rect x="14.5" y="7" width="6.5" height="12.5" rx="2" />
  </Icon>
);

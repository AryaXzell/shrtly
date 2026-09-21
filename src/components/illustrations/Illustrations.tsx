import React from 'react';

interface IllustrationProps {
  className?: string;
  size?: number;
}

/**
 * Bespoke geometric SVG illustrations designed specifically for SHRTLY.
 * Visual language: 1.5px - 2px precision strokes, subtle accent fills,
 * calibrated for dark & light mode, expressing "Fast. Quiet. Clear."
 */

/**
 * 1. Empty Links List State (LinksView)
 * Visual: Floating cards with dotted matrix and interconnected shortlink pill.
 */
export const NoLinksIllustration: React.FC<IllustrationProps> = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mx-auto ${className}`}
    aria-hidden="true"
  >
    {/* Soft subtle background ring */}
    <circle
      cx="70"
      cy="70"
      r="58"
      className="stroke-neutral-200/70 dark:stroke-neutral-800/80"
      strokeWidth="1.5"
      strokeDasharray="4 6"
    />
    <circle
      cx="70"
      cy="70"
      r="44"
      className="fill-neutral-100/50 dark:fill-neutral-900/40"
    />

    {/* Background URL Document Slate */}
    <rect
      x="34"
      y="38"
      width="72"
      height="64"
      rx="16"
      className="fill-white dark:fill-neutral-900 stroke-neutral-200 dark:stroke-neutral-800"
      strokeWidth="1.5"
    />
    
    {/* Clean text lines inside slate */}
    <line x1="46" y1="52" x2="68" y2="52" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="2" strokeLinecap="round" />
    <line x1="46" y1="60" x2="84" y2="60" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="2" strokeLinecap="round" />
    <line x1="46" y1="68" x2="60" y2="68" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="2" strokeLinecap="round" />

    {/* Front Floating Shortlink Capsule */}
    <g transform="translate(42, 66)">
      <rect
        x="0"
        y="0"
        width="66"
        height="30"
        rx="15"
        className="fill-neutral-950 dark:fill-white shadow-lg"
      />
      {/* Mini chain icon inside capsule */}
      <path
        d="M20 15H26M23 11H19C16.7909 11 15 12.7909 15 15C15 17.2091 16.7909 19 19 19H23M27 11H31C33.2091 11 35 12.7909 35 15C35 17.2091 33.2091 19 31 19H27"
        className="stroke-white dark:stroke-neutral-950"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Indicator dot */}
      <circle cx="48" cy="15" r="2.5" className="fill-emerald-400 dark:fill-emerald-500" />
    </g>

    {/* Floating accent elements */}
    <circle cx="28" cy="50" r="2.5" className="fill-neutral-300 dark:fill-neutral-700" />
    <circle cx="108" cy="42" r="3.5" className="fill-neutral-300 dark:fill-neutral-700" />
    <circle cx="112" cy="88" r="2" className="fill-neutral-400 dark:fill-neutral-600" />
  </svg>
);

/**
 * 2. Search Not Found State (LinksView filter/search)
 * Visual: Precision magnifying loupe scanning over an empty dotted coordinate.
 */
export const NoSearchResultsIllustration: React.FC<IllustrationProps> = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mx-auto ${className}`}
    aria-hidden="true"
  >
    {/* Grid radar circle */}
    <circle cx="70" cy="70" r="54" className="stroke-neutral-200/80 dark:stroke-neutral-800/80" strokeWidth="1.5" strokeDasharray="3 4" />
    <circle cx="70" cy="70" r="32" className="stroke-neutral-200/40 dark:stroke-neutral-800/40" strokeWidth="1" />

    {/* Dotted target reticle */}
    <line x1="70" y1="20" x2="70" y2="28" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="70" y1="112" x2="70" y2="120" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="70" x2="28" y2="70" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="112" y1="70" x2="120" y2="70" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5" strokeLinecap="round" />

    {/* Search Lens */}
    <g transform="translate(42, 40)">
      <circle
        cx="24"
        cy="24"
        r="22"
        className="fill-white/80 dark:fill-neutral-900/80 stroke-neutral-950 dark:stroke-white"
        strokeWidth="2.5"
      />
      {/* Light glass reflection */}
      <path
        d="M12 20C13 16 16 13 20 12"
        className="stroke-neutral-300 dark:stroke-neutral-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Minus/empty indicator inside lens */}
      <line
        x1="18"
        y1="24"
        x2="30"
        y2="24"
        className="stroke-neutral-400 dark:stroke-neutral-500"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Handle */}
      <path
        d="M40 40L56 56"
        className="stroke-neutral-950 dark:stroke-white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

/**
 * 3. Analytics Zero State (LinkDetailView)
 * Visual: Calm waiting graph with pulse indicator and quiet metric pedestals.
 */
export const NoAnalyticsIllustration: React.FC<IllustrationProps> = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mx-auto ${className}`}
    aria-hidden="true"
  >
    {/* Base canvas card */}
    <rect
      x="25"
      y="30"
      width="90"
      height="76"
      rx="18"
      className="fill-white dark:fill-neutral-900 stroke-neutral-200 dark:stroke-neutral-800"
      strokeWidth="1.5"
    />

    {/* Horizontal grid lines */}
    <line x1="37" y1="52" x2="103" y2="52" className="stroke-neutral-100 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3 3" />
    <line x1="37" y1="72" x2="103" y2="72" className="stroke-neutral-100 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3 3" />
    <line x1="37" y1="92" x2="103" y2="92" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1.5" />

    {/* Pillar bars - faint resting state */}
    <rect x="42" y="80" width="8" height="12" rx="3" className="fill-neutral-100 dark:fill-neutral-800" />
    <rect x="58" y="74" width="8" height="18" rx="3" className="fill-neutral-100 dark:fill-neutral-800" />
    <rect x="74" y="82" width="8" height="10" rx="3" className="fill-neutral-100 dark:fill-neutral-800" />
    <rect x="90" y="68" width="8" height="24" rx="3" className="fill-neutral-200 dark:fill-neutral-700" />

    {/* Delicate trending pulse */}
    <path
      d="M42 82C52 82 56 62 68 62C78 62 82 48 94 48"
      className="stroke-neutral-950 dark:stroke-white"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="94" cy="48" r="4" className="fill-emerald-500 animate-pulse" />
  </svg>
);

/**
 * 4. Welcome / First Time Shorten State (HomeView)
 * Visual: Long URL ribbon folding swiftly into a compact shortlink capsule.
 */
export const WelcomeIllustration: React.FC<IllustrationProps> = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mx-auto ${className}`}
    aria-hidden="true"
  >
    {/* Concentric speed lines */}
    <circle cx="70" cy="70" r="56" className="stroke-neutral-200/60 dark:stroke-neutral-800/60" strokeWidth="1.5" strokeDasharray="3 5" />

    {/* Long URL strip (origination) */}
    <rect
      x="22"
      y="42"
      width="96"
      height="22"
      rx="11"
      className="fill-neutral-100 dark:fill-neutral-800/80 stroke-neutral-300 dark:stroke-neutral-700"
      strokeWidth="1.5"
    />
    <line x1="32" y1="53" x2="48" y2="53" className="stroke-neutral-400 dark:stroke-neutral-500" strokeWidth="2" strokeLinecap="round" />
    <line x1="54" y1="53" x2="98" y2="53" className="stroke-neutral-300 dark:stroke-neutral-600" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />

    {/* Downward transformation arrows */}
    <path
      d="M70 66V74M66 70L70 74L74 70"
      className="stroke-neutral-400 dark:stroke-neutral-500"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Compact shortlink capsule (destination) */}
    <rect
      x="38"
      y="80"
      width="64"
      height="26"
      rx="13"
      className="fill-neutral-950 dark:fill-white shadow-md"
    />
    <circle cx="50" cy="93" r="2.5" className="fill-emerald-400 dark:fill-emerald-500" />
    <line x1="58" y1="93" x2="88" y2="93" className="stroke-white dark:stroke-neutral-900" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * 5. Link Expired State (StatusView)
 * Visual: Architectural hourglass with falling sand grains.
 */
export const LinkExpiredIllustration: React.FC<IllustrationProps> = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mx-auto ${className}`}
    aria-hidden="true"
  >
    <circle cx="70" cy="70" r="54" className="stroke-amber-200/80 dark:stroke-amber-900/40" strokeWidth="1.5" strokeDasharray="4 4" />

    {/* Hourglass body */}
    <g transform="translate(42, 34)">
      <path
        d="M6 8H50M6 64H50M12 8V20C12 28 22 36 28 36C34 36 44 28 44 20V8M12 64V52C12 44 22 36 28 36C34 36 44 44 44 52V64"
        className="stroke-neutral-950 dark:stroke-white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Base Plates */}
      <line x1="4" y1="8" x2="52" y2="8" className="stroke-neutral-950 dark:stroke-white" strokeWidth="3" strokeLinecap="round" />
      <line x1="4" y1="64" x2="52" y2="64" className="stroke-neutral-950 dark:stroke-white" strokeWidth="3" strokeLinecap="round" />
      
      {/* Falling Sand in Lower Chamber */}
      <path
        d="M20 58C22 52 28 48 28 48C28 48 34 52 36 58H20Z"
        className="fill-amber-500 dark:fill-amber-400"
      />
      <circle cx="28" cy="42" r="1.5" className="fill-amber-500 dark:fill-amber-400" />
      <circle cx="28" cy="38" r="1.5" className="fill-amber-500 dark:fill-amber-400" />
    </g>
  </svg>
);

/**
 * 6. Link Disabled State (StatusView)
 * Visual: Modern padlock protected by concentric privacy shields.
 */
export const LinkDisabledIllustration: React.FC<IllustrationProps> = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mx-auto ${className}`}
    aria-hidden="true"
  >
    <circle cx="70" cy="70" r="54" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1.5" />

    {/* Padlock container */}
    <g transform="translate(46, 38)">
      {/* Shackle */}
      <path
        d="M12 28V18C12 11.3726 17.3726 6 24 6C30.6274 6 36 11.3726 36 18V28"
        className="stroke-neutral-950 dark:stroke-white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Lock Body */}
      <rect
        x="4"
        y="28"
        width="40"
        height="32"
        rx="10"
        className="fill-white dark:fill-neutral-900 stroke-neutral-950 dark:stroke-white"
        strokeWidth="2.5"
      />
      {/* Keyhole */}
      <circle cx="24" cy="42" r="3" className="fill-neutral-950 dark:fill-white" />
      <line x1="24" y1="44" x2="24" y2="50" className="stroke-neutral-950 dark:stroke-white" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
);

/**
 * 7. Unknown Link / 404 State (StatusView)
 * Visual: Floating dashed broken path with calm not-found marker.
 */
export const UnknownLinkIllustration: React.FC<IllustrationProps> = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mx-auto ${className}`}
    aria-hidden="true"
  >
    <circle cx="70" cy="70" r="54" className="stroke-neutral-200/80 dark:stroke-neutral-800/80" strokeWidth="1.5" strokeDasharray="3 4" />

    {/* Broken Link segments */}
    <g transform="translate(38, 44)">
      {/* Left loop */}
      <rect
        x="0"
        y="8"
        width="26"
        height="18"
        rx="9"
        className="stroke-neutral-950 dark:stroke-white"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Right loop separated */}
      <rect
        x="38"
        y="26"
        width="26"
        height="18"
        rx="9"
        className="stroke-neutral-950 dark:stroke-white"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Disconnected dashed bridge line */}
      <line
        x1="22"
        y1="20"
        x2="42"
        y2="32"
        className="stroke-rose-500"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      {/* Floating question pulse */}
      <circle cx="48" cy="10" r="3" className="fill-rose-500" />
      <circle cx="16" cy="42" r="2.5" className="fill-neutral-300 dark:fill-neutral-700" />
    </g>
  </svg>
);

/**
 * 8. Suspicious Destination State (WarningView)
 * Visual: High security shield with warning indicator and quiet geometric perimeter.
 */
export const SuspiciousLinkIllustration: React.FC<IllustrationProps> = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mx-auto ${className}`}
    aria-hidden="true"
  >
    <circle cx="70" cy="70" r="54" className="stroke-amber-300/70 dark:stroke-amber-900/40" strokeWidth="1.5" />

    {/* Shield */}
    <g transform="translate(43, 34)">
      <path
        d="M27 4L48 13V30C48 44 38 56 27 63C16 56 6 44 6 30V13L27 4Z"
        className="fill-amber-50/50 dark:fill-amber-950/30 stroke-amber-600 dark:stroke-amber-400"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Exclamation mark inside shield */}
      <line x1="27" y1="22" x2="27" y2="36" className="stroke-amber-700 dark:stroke-amber-300" strokeWidth="3" strokeLinecap="round" />
      <circle cx="27" cy="46" r="2" className="fill-amber-700 dark:fill-amber-300" />
    </g>
  </svg>
);

/**
 * 9. Offline State
 * Visual: Faded network wave with subtle reconnect symbol.
 */
export const OfflineIllustration: React.FC<IllustrationProps> = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`mx-auto ${className}`}
    aria-hidden="true"
  >
    <circle cx="70" cy="70" r="54" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1.5" />

    {/* Radiating signal rings */}
    <g transform="translate(42, 42)">
      <path
        d="M4 22C16 10 40 10 52 22"
        className="stroke-neutral-300 dark:stroke-neutral-700"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M14 34C21 27 35 27 42 34"
        className="stroke-neutral-400 dark:stroke-neutral-600"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="28" cy="46" r="4" className="fill-neutral-900 dark:fill-neutral-100" />

      {/* Strike diagonal line */}
      <line x1="2" y1="6" x2="54" y2="52" className="stroke-rose-500" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
);

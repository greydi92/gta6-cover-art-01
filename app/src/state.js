// Cover state: the serialisable model behind the editor. Photos live outside it
// (loaded images, indexed by panels[].photo), so undo/redo can snapshot this
// object as plain JSON.

export function defaultPanel(photo = 0) {
  return { photo, zoom: 1, ox: 0, oy: 0 };
}

export function defaultState() {
  return {
    layout: 'grid4',
    grade: 'sunset',
    title: 'Neon Shore',
    subtitle: 'a neon coast story',
    titleSize: 0.115,
    titleColor: 'sunset',
    titlePos: 'bottom',
    titleY: 0,
    outline: true,
    subtitleColor: '#ffd60a',
    badge: 'Est. 2026',
    stars: 4,
    halftone: true,
    grain: true,
    grainAmount: 0.10,
    vignette: true,
    frame: 'ink',
    // One slot per panel position (max 9, the nine-panel grid). Layouts use a prefix.
    panels: [
      defaultPanel(0), defaultPanel(1), defaultPanel(0), defaultPanel(1),
      defaultPanel(0), defaultPanel(1), defaultPanel(0), defaultPanel(1),
      defaultPanel(0),
    ],
  };
}

// One-click looks: layout + grade + lettering, applied on top of the photos.
export const PRESETS = {
  sunsetSleeve: {
    label: 'Sunset Sleeve', layout: 'grid4', grade: 'sunset',
    title: 'Neon Shore', subtitle: 'a neon coast story', titleColor: 'sunset',
    titlePos: 'bottom', halftone: true, grain: true, vignette: true, frame: 'ink', stars: 4,
  },
  neonCoast: {
    label: 'Neon Coast', layout: 'hero3', grade: 'neon',
    title: 'Night Shift', subtitle: 'lights on, brakes off', titleColor: 'pink',
    titlePos: 'bottom', halftone: true, grain: true, vignette: true, frame: 'ink', stars: 5,
  },
  palmPoster: {
    label: 'Palm Poster', layout: 'grid9', grade: 'palm',
    title: 'Palm Heat', subtitle: 'golden hour, every hour', titleColor: 'white',
    titlePos: 'top', halftone: false, grain: true, vignette: true, frame: 'white', stars: 3,
  },
  goldStandard: {
    label: 'Gold Standard', layout: 'tilt', grade: 'gold',
    title: 'Pier Pressure', subtitle: 'catch the sunset', titleColor: 'gold',
    titlePos: 'bottom', halftone: true, grain: true, vignette: true, frame: 'ink', stars: 4,
  },
  monoNoir: {
    label: 'Mono Noir', layout: 'fullbleed', grade: 'noir',
    title: 'Night Shift', subtitle: 'a neon coast story', titleColor: 'white',
    titlePos: 'center', halftone: false, grain: true, vignette: true, frame: 'none', stars: 0,
  },
  splitDuo: {
    label: 'Split Duo', layout: 'split2', grade: 'teal',
    title: 'Two Sides', subtitle: 'day and night on one street', titleColor: 'cyan',
    titlePos: 'bottom', halftone: true, grain: false, vignette: true, frame: 'ink', stars: 3,
  },
};

export const EXPORT_SIZES = [
  { key: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { key: 'story', label: 'Story 1080 × 1350', w: 1080, h: 1350 },
  { key: 'wide', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export const SAMPLE_PHOTOS = [
  { src: 'samples/pier.jpg', name: 'Pier' },
  { src: 'samples/boulevard.jpg', name: 'Boulevard' },
];

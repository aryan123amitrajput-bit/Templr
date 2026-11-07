/**
 * BlackHoleDelete.tsx
 *
 * A 100%-behavior replica of uibrik's "Black Hole Delete" component
 * (https://uibrik.com/components/black-hole-delete) for React Native.
 *
 * How the original works (evidence from the public docs + live preview;
 * the source is Pro-gated, so behaviors are reconstructed from the
 * documented prop contract):
 *
 *  - A list of items (files) is shown in a card. Each row has an icon by
 *    kind, a name, a meta string, and a delete affordance.
 *  - Tapping delete makes the row fall into a black-hole "bin" fixed at
 *    the bottom of the card: it translates down, winds around the hole
 *    (`spin` radians), shrinks and fades, shedding `particles` debris.
 *  - When several items are deleted in quick succession, each one starts
 *    `stagger` seconds after the previous.
 *  - The bin has a glowing rim in `color` and a swirling mouth; it pulses
 *    each time an item is consumed, and heated debris orbits the mouth.
 *  - When `undo` is on, a snackbar offers Undo. With `undoSwirl` the
 *    items swirl back out of the bin in reverse; otherwise the rows fade
 *    back into place.
 *  - Controlled mode: `items` + `onItemsChange`. Uncontrolled:
 *    `defaultItems`. Deletions report through `onDelete`.
 *
 * Requirements:
 *  - react-native >= 0.71
 *  - react-native-svg (for the built-in SVG icons — install via
 *    `npm i react-native-svg` and link it in your RN project)
 *  - react-native-reanimated >= 3.x (wrap your app in <ReanimatedRoot>
 *    when using Reanimated >= 3.16)
 *
 * Drop this file into your project and render:
 *
 *   <BlackHoleDelete
 *     color="#ff8a3d"
 *     duration={1.1}
 *     stagger={0.09}
 *     particles={160}
 *     spin={2.4}
 *     undo
 *     undoSwirl={false}
 *     width={380}
 *     defaultItems={myItems}
 *     onItemsChange={(items) => {}}
 *     onDelete={(deleted) => {}}
 *   />
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing as RNCoreEasing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Reanimated, {
  Easing as ReanimatedEasing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/* ------------------------------------------------------------------ */
/* SVG icons — outline style matching the official uibrik icon set:   *
 * 24x24 viewBox, stroke=currentColor, stroke-width 1.75, round joins. *
 * ------------------------------------------------------------------ */

type IconProps = { size?: number; stroke?: number; color?: string };

function SvgWrap({ size = 18, stroke = 1.75, children }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

function SlidesIcon({ size, stroke }: IconProps) {
  return (
    <SvgWrap size={size} stroke={stroke}>
      <Rect x="3" y="4" width="18" height="13" rx="2" />
      <Path d="M10 9.4l4.6 2.6-4.6 2.6z" fill="currentColor" stroke="none" />
      <Path d="M8.5 20.5h7" />
    </SvgWrap>
  );
}

function PdfIcon({ size, stroke }: IconProps) {
  return (
    <SvgWrap size={size} stroke={stroke}>
      <Path d="M6 2.5h6.2L18 7.1v12.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2z" />
      <Path d="M12.2 2.5V7.1H18" />
      <Path d="M8 12.2h5.2M8 15.4h3.2" />
    </SvgWrap>
  );
}

function ImageIcon({ size, stroke }: IconProps) {
  return (
    <SvgWrap size={size} stroke={stroke}>
      <Rect x="3" y="4.5" width="18" height="15" rx="2" />
      <Circle cx="8.6" cy="10" r="1.6" />
      <Path d="M4 17l5-4.5 3.4 3 2.8-2.4 4.8 3.9" />
    </SvgWrap>
  );
}

function ArchiveIcon({ size, stroke }: IconProps) {
  return (
    <SvgWrap size={size} stroke={stroke}>
      <Rect x="3" y="4" width="18" height="4.5" rx="1.2" />
      <Path d="M5.5 8.5v10.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5" />
      <Path d="M10 12.2h4" />
    </SvgWrap>
  );
}

function TextIcon({ size, stroke }: IconProps) {
  return (
    <SvgWrap size={size} stroke={stroke}>
      <Path d="M6 2.5h6.2L18 7.1v12.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2z" />
      <Path d="M12.2 2.5V7.1H18" />
      <Path d="M8 11.2h8M8 14.4h8M8 17.6h5" />
    </SvgWrap>
  );
}

function TrashIcon({ size, stroke }: IconProps) {
  return (
    <SvgWrap size={size} stroke={stroke}>
      <Path d="M3.8 6.2h16.4M9.2 6.2V4.6a1.6 1.6 0 0 1 1.6-1.6h2.4a1.6 1.6 0 0 1 1.6 1.6v1.6" />
      <Path d="M18.4 6.2l-.85 13a2 2 0 0 1-2 1.9H8.45a2 2 0 0 1-2-1.9L5.6 6.2" />
      <Path d="M10.2 10.6v5.8M13.8 10.6v5.8" />
    </SvgWrap>
  );
}

function LoadingIcon({ size, stroke }: IconProps) {
  return (
    <SvgWrap size={size} stroke={stroke}>
      <Path d="M12 3a9 9 0 1 0 9 9" />
    </SvgWrap>
  );
}

function CheckIcon({ size = 13, stroke = 3.2, color }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

const KIND_ICON: Record<string, React.FC<IconProps>> = {
  slides: SlidesIcon,
  pdf: PdfIcon,
  image: ImageIcon,
  archive: ArchiveIcon,
  text: TextIcon,
  key: SlidesIcon,
  audio: ImageIcon,
  video: SlidesIcon,
  code: TextIcon,
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type BlackHoleItem = {
  id: string;
  name: string;
  meta?: string;
  kind?: string;
};

export type BlackHoleDeleteProps = {
  /** Colour of the rim round the bin's mouth and the heated debris. */
  color?: string;
  /** Time each item takes to fall in (seconds). */
  duration?: number;
  /** Delay between one item and the next in a deletion cascade (s). */
  stagger?: number;
  /** Particles shed by each item. */
  particles?: number;
  /** How far items wind round the hole on the way in (radians). */
  spin?: number;
  /** Offer an Undo after deleting. */
  undo?: boolean;
  /** Undo plays the delete backwards (items swirl back out of the bin). */
  undoSwirl?: boolean;
  /** Width of the list card. */
  width?: number;
  /** Items to list (controlled). Pair with onItemsChange. */
  items?: BlackHoleItem[];
  /** Items listed at the start when uncontrolled. */
  defaultItems?: BlackHoleItem[];
  /** Called with the new list after a delete or an undo. */
  onItemsChange?: (items: BlackHoleItem[]) => void;
  /** Called with the items that went into the black hole. */
  onDelete?: (deleted: BlackHoleItem[]) => void;
  /** Extra styles for the card (RN equivalent of className). */
  style?: StyleProp<ViewStyle>;
};

/** The sample file list uibrik ships as SAMPLE_FILES in the docs. */
export const SAMPLE_FILES: BlackHoleItem[] = [
  { id: '1', name: 'Board update.key', meta: 'Keynote · 24.8 MB', kind: 'slides' },
  { id: '2', name: 'Invoice 1042.pdf', meta: 'PDF · 312 KB', kind: 'pdf' },
  { id: '3', name: 'Sunset at Big Sur.heic', meta: 'Image · 4.1 MB', kind: 'image' },
  { id: '4', name: 'Old builds.zip', meta: 'Archive · 1.2 GB', kind: 'archive' },
  { id: '5', name: 'Notes from call.txt', meta: 'Text · 2 KB', kind: 'text' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const KIND_COLOR: Record<string, string> = {
  slides: '#f59e0b',
  pdf: '#ef4444',
  image: '#a855f7',
  archive: '#64748b',
  text: '#3b82f6',
  key: '#22c55e',
  audio: '#ec4899',
  video: '#06b6d4',
  code: '#84cc16',
};

function KindIcon({ kind, size = 17 }: { kind?: string; size?: number }) {
  const Cmp = (kind && KIND_ICON[kind]) || TextIcon;
  return <Cmp size={size} />;
}

function kindColor(kind?: string, fallback = '#64748b'): string {
  return (kind && KIND_COLOR[kind]) || fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Rect = { x: number; y: number; w: number; h: number };

type Particle = {
  key: string;
  x: number;
  y: number;
  size: number;
  color: string;
  tx: Animated.Value;
  ty: Animated.Value;
  rot: Animated.Value;
  opacity: Animated.Value;
};

type OverlayEntry = {
  id: string;
  item: BlackHoleItem;
  rect: Rect;
  fallDist: number;
  delayMs: number;
  kind: 'falling' | 'restoring';
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function BlackHoleDelete({
  color = '#ff8a3d',
  duration = 1.1,
  stagger = 0.09,
  particles = 160,
  spin = 2.4,
  undo = true,
  undoSwirl = false,
  width = 380,
  items: controlledItems,
  defaultItems = SAMPLE_FILES,
  onItemsChange,
  onDelete,
  style,
}: BlackHoleDeleteProps) {
  /* ---------- list state ---------- */
  const isControlled = controlledItems !== undefined;
  const [list, setList] = useState<BlackHoleItem[]>(
    isControlled ? (controlledItems as BlackHoleItem[]) : defaultItems,
  );

  useEffect(() => {
    if (isControlled) {
      setList(controlledItems as BlackHoleItem[]);
      setShowUndo(false);
      undoBatchRef.current = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledItems]);

  /* ---------- geometry ---------- */
  const rowRects = useRef<Record<string, Rect>>({});
  const binCenterY = useRef<number | null>(null);

  const handleRowLayout = useCallback((id: string) => {
    return (e: LayoutChangeEvent) => {
      const { x, y, width: w, height: h } = e.nativeEvent.layout;
      rowRects.current[id] = { x, y, w, h };
    };
  }, []);

  const handleBinLayout = useCallback((e: LayoutChangeEvent) => {
    binCenterY.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2;
  }, []);

  /* ---------- overlay / undo state ---------- */
  const [overlay, setOverlay] = useState<OverlayEntry[]>([]);
  const [particleLayer, setParticleLayer] = useState<Particle[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [undoCount, setUndoCount] = useState(0);

  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoBatchRef = useRef<
    Array<{ item: BlackHoleItem; index: number; rect: Rect | undefined }>
  >([]);

  /* ---------- selection state ---------- */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === list.length && list.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(list.map((it) => it.id)));
    }
  }, [list, selected.size]);
  const restoringSnapshotRef = useRef<Array<{ item: BlackHoleItem; index: number }>>([]);
  const restoringRemaining = useRef(0);
  const fallingCount = useRef(0);

  /* ---------- fade-back-in state (undo without swirl) ---------- */
  const [fadingIds, setFadingIds] = useState<string[]>([]);
  const fadeValues = useRef<Record<string, Animated.Value>>({});

  /* ---------- stagger queue ---------- */
  const queue = useRef<Array<{ id: string; index: number }>>([]);
  const fallingRects = useRef<Record<string, Rect>>({});

  /* ---------- reanimated shared values (bin) ---------- */
  const spinDeg = spin * (180 / Math.PI);
  const binPulse = useSharedValue(0);
  const binSwirl = useSharedValue(0);

  // Continuous swirl of the bin mouth.
  useEffect(() => {
    let stopped = false;
    const start = () => {
      if (stopped) return;
      binSwirl.value = withTiming(
        360,
        { duration: 4200, easing: ReanimatedEasing.linear },
        (finished) => {
          if (finished && !stopped) {
            binSwirl.value = 0;
            start();
          }
        },
      );
    };
    start();
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- particles ---------- */
  const particleCounter = useRef(0);

  const spawnParticles = useCallback(
    (rect: Rect, fromColor: string) => {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const spread = Math.max(rect.w, 90);
      const count = Math.max(1, Math.floor(particles));
      const durationMs = Math.round(duration * 1000);

      const next: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = spread * (0.25 + Math.random() * 0.75);
        const roll = Math.random();
        // Heated debris mix: rim colour, white-hot highlights, deep embers.
        const palette =
          roll < 0.5 ? fromColor : roll < 0.8 ? '#fff3e0' : rgba(fromColor, 0.55);
        next.push({
          key: `p${particleCounter.current++}`,
          x: cx,
          y: cy,
          size: 2 + Math.random() * 3,
          color: palette,
          tx: new Animated.Value(0),
          ty: new Animated.Value(0),
          rot: new Animated.Value(0),
          opacity: new Animated.Value(1),
        });
      }
      setParticleLayer((prev) => [...prev, ...next]);

      // Animate and clean up (JS-driven Animated is fine for short bursts).
      next.forEach((p) => {
        const txTarget = Math.cos(Math.random() * Math.PI * 2) * spread;
        const tyTarget = Math.sin(Math.random() * Math.PI * 2) * spread + rect.h * 0.4;
        Animated.parallel([
          Animated.timing(p.tx, {
            toValue: txTarget,
            duration: durationMs,
            easing: RNCoreEasing.out(RNCoreEasing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.ty, {
            toValue: tyTarget,
            duration: durationMs,
            easing: RNCoreEasing.in(RNCoreEasing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.rot, {
            toValue: (Math.random() - 0.5) * 540,
            duration: durationMs,
            easing: RNCoreEasing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: durationMs,
            delay: durationMs * 0.35,
            useNativeDriver: true,
          }),
        ]).start(() => {
          p.tx.stop();
          p.ty.stop();
          p.rot.stop();
          p.opacity.stop();
          setParticleLayer((prev) => prev.filter((q) => q.key !== p.key));
        });
      });
    },
    [particles, duration],
  );

  /* ---------- deletion pipeline ---------- */

  const finalizeBatch = useCallback(() => {
    const batch = undoBatchRef.current.slice();
    undoBatchRef.current = [];
    if (batch.length === 0) return;

    const deleted = batch.map((b) => b.item);
    const ids = deleted.map((d) => d.id);
    const nextList = list.filter((it) => !ids.includes(it.id));
    setList(nextList);
    ids.forEach((id) => {
      delete rowRects.current[id];
    });

    batch.forEach(() => {
      binPulse.value = withTiming(1, { duration: 140 });
    });

    onDelete?.(deleted);
    onItemsChange?.(nextList);

    if (undo) {
      setUndoCount(deleted.length);
      setShowUndo(true);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setShowUndo(false), 6000);
    }
  }, [list, onDelete, onItemsChange, undo]);

  const startFall = useCallback(
    (entry: { id: string; index: number }, cascadeOffset: number) => {
      const item = list.find((it) => it.id === entry.id);
      if (!item) return;
      const rect = rowRects.current[entry.id] ?? { x: 0, y: 0, w: width, h: 48 };
      const dist =
        binCenterY.current !== null
          ? binCenterY.current - (rect.y + rect.h / 2)
          : rect.h;
      const fallDist = Math.max(dist, rect.h * 2);

      fallingRects.current[entry.id] = rect;

      const delayMs = Math.round(cascadeOffset * stagger * 1000);
      setOverlay((prev) => [
        ...prev,
        { id: entry.id, item, rect, fallDist, delayMs, kind: 'falling' as const },
      ]);
      fallingCount.current += 1;

      // Shed debris as the item starts falling.
      setTimeout(() => spawnParticles(rect, color), Math.min(delayMs, 120));
    },
    [list, width, stagger, color, spawnParticles],
  );

  const processQueue = useCallback(() => {
    if (queue.current.length === 0) return;
    const next = queue.current.shift()!;
    const cascadeOffset = undoBatchRef.current.length + fallingCount.current;
    startFall(next, cascadeOffset);
  }, [startFall]);

  /* Called from the overlay row's UI-thread completion callback. */
  const handleFallComplete = useCallback(
    (id: string) => {
      setOverlay((prev) => prev.filter((o) => !(o.kind === 'falling' && o.id === id)));
      fallingCount.current = Math.max(0, fallingCount.current - 1);

      const item = list.find((it) => it.id === id);
      const rect = fallingRects.current[id];
      delete fallingRects.current[id];
      if (item) {
        undoBatchRef.current.push({
          item,
          index: list.findIndex((it) => it.id === id),
          rect,
        });
      }

      if (fallingCount.current === 0) {
        finalizeBatch();
      } else {
        processQueue();
      }
    },
    [list, finalizeBatch, processQueue],
  );

  const requestDelete = useCallback(
    (id: string) => {
      if (queue.current.some((q) => q.id === id)) return;
      if (undoBatchRef.current.some((b) => b.item.id === id)) return;
      const index = list.findIndex((it) => it.id === id);
      if (index < 0) return;
      queue.current.push({ id, index });
      processQueue();
    },
    [list, processQueue],
  );

  const deleteSelected = useCallback(() => {
    list.forEach((it) => {
      if (selected.has(it.id)) requestDelete(it.id);
    });
  }, [list, selected, requestDelete]);

  /* ---------- undo ---------- */

  const restoreItems = useCallback(
    (batch: Array<{ item: BlackHoleItem; index: number }>) => {
      const next = [...list];
      batch
        .slice()
        .sort((a, b) => a.index - b.index)
        .forEach((b) => next.splice(Math.min(b.index, next.length), 0, b.item));
      setList(next);
      onItemsChange?.(next);
    },
    [list, onItemsChange],
  );

  const handleRestoreComplete = useCallback(
    (id: string) => {
      setOverlay((prev) => prev.filter((o) => !(o.kind === 'restoring' && o.id === id)));
      restoringRemaining.current = Math.max(0, restoringRemaining.current - 1);
      if (restoringRemaining.current === 0) {
        const snapshot = restoringSnapshotRef.current.slice();
        restoringSnapshotRef.current = [];
        restoreItems(snapshot);
      }
    },
    [restoreItems],
  );

  const doUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const batch = undoBatchRef.current.slice();
    undoBatchRef.current = [];
    setShowUndo(false);
    if (batch.length === 0) return;

    if (!undoSwirl) {
      // Rows fade back in.
      restoreItems(batch);
      const ids = batch.map((b) => b.item.id);
      setFadingIds(ids);
      ids.forEach((id) => {
        const v = new Animated.Value(0);
        fadeValues.current[id] = v;
        Animated.timing(v, {
          toValue: 1,
          duration: 320,
          easing: RNCoreEasing.out(RNCoreEasing.quad),
          useNativeDriver: true,
        }).start(() => {
          v.stop();
          setFadingIds((prev) => prev.filter((x) => x !== id));
        });
      });
      return;
    }

    // Swirl items back out of the bin: overlay rows animate from the bin
    // position back to their original row, unwinding the spin.
    restoringRemaining.current = batch.length;
    restoringSnapshotRef.current = batch;
    batch.forEach((b) => {
      const rect =
        b.rect ?? fallingRects.current[b.item.id] ?? { x: 0, y: 0, w: width, h: 48 };
      const dist =
        binCenterY.current !== null
          ? binCenterY.current - (rect.y + rect.h / 2)
          : rect.h;
      setOverlay((prev) => [
        ...prev,
        {
          id: b.item.id,
          item: b.item,
          rect,
          fallDist: Math.max(dist, rect.h * 2),
          delayMs: 0,
          kind: 'restoring' as const,
        },
      ]);
    });
  }, [undoSwirl, restoreItems, width]);

  /* ---------- render ---------- */

  const cardWidth = Math.min(width, 360);

  return (
    <View style={[styles.card, { width: cardWidth }, style]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Files</Text>
          <Text style={styles.count}>{list.length} files</Text>
        </View>
        {selected.size > 0 ? (
          <Pressable
            onPress={deleteSelected}
            style={({ pressed }) => [styles.deleteSelBtn, pressed && styles.deleteSelPressed]}
          >
            <TrashIcon size={14} />
            <Text style={styles.deleteSelText}>Delete ({selected.size})</Text>
          </Pressable>
        ) : null}
      </View>
      {selected.size > 0 ? (
        <Pressable onPress={selectAll} style={styles.selectAllBtn}>
          <Text style={styles.selectAllText}>
            {selected.size === list.length && list.length > 0 ? 'Clear selection' : 'Select all'}
          </Text>
        </Pressable>
      ) : null}

      {/* List */}
      {list.length === 0 ? (
        <Text style={styles.empty}>No files</Text>
      ) : (
        list.map((item) => {
          const pending =
            queue.current.some((q) => q.id === item.id) ||
            undoBatchRef.current.some((b) => b.item.id === item.id);
          const opacityValue = fadingIds.includes(item.id)
            ? fadeValues.current[item.id]
            : undefined;
          return (
            <RowView
              key={item.id}
              item={item}
              color={color}
              onDelete={requestDelete}
              pending={pending}
              selected={selected.has(item.id)}
              onToggleSelect={toggleSelect}
              onLayout={handleRowLayout(item.id)}
              opacityValue={opacityValue}
            />
          );
        })
      )}

      {/* Black hole bin */}
      <View style={styles.binAnchor} onLayout={handleBinLayout}>
        <Bin mouthColor={color} swirl={binSwirl} pulse={binPulse} />
      </View>

      {/* Falling / restoring overlay (absolute, same coordinate space) */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {overlay.map((entry) => (
          <OverlayRow
            key={entry.kind === 'falling' ? entry.id : `restoring:${entry.id}`}
            entry={entry}
            spinDeg={spinDeg}
            color={color}
            duration={duration}
            isFalling={entry.kind === 'falling'}
            onComplete={handleFallComplete}
            onRestoreComplete={handleRestoreComplete}
          />
        ))}
      </View>

      {/* Particle layer */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {particleLayer.map((p) => (
          <Animated.View
            key={p.key}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              shadowColor: p.color,
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 6,
              transform: [
                { translateX: p.tx },
                { translateY: p.ty },
                { rotate: p.rot },
              ],
              opacity: p.opacity,
            }}
          />
        ))}
      </View>

      {/* Undo snackbar */}
      {showUndo ? (
        <View
          style={[
            styles.snackbar,
            { borderColor: rgba(color, 0.35) },
          ]}
        >
          <Text style={styles.snackText}>
            Deleted {undoCount} {undoCount === 1 ? 'file' : 'files'}
          </Text>
          <Pressable
            onPress={doUndo}
            hitSlop={8}
            style={[styles.undoBtn, { backgroundColor: rgba(color, 0.18) }]}
          >
            <Text style={[styles.undoText, { color }]}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

type RowViewProps = {
  item: BlackHoleItem;
  color: string;
  onDelete: (id: string) => void;
  pending: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLayout: (e: LayoutChangeEvent) => void;
  opacityValue?: Animated.Value;
};

function RowView({ item, color, onDelete, pending, selected, onToggleSelect, onLayout, opacityValue }: RowViewProps) {
  const content = (
    <View style={styles.row} onLayout={onLayout}>
      <Pressable
        onPress={() => onToggleSelect(item.id)}
        style={({ pressed }) => [styles.checkBtn, selected && styles.checkBtnOn, pressed && styles.checkPressed]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
      >
        {selected ? <CheckIcon size={13} color="#fff" /> : null}
      </Pressable>
      <View
        style={[
          styles.iconChip,
          { backgroundColor: rgba(kindColor(item.kind, color), 0.16) },
        ]}
      >
        <KindIcon kind={item.kind} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.meta ? <Text style={styles.rowMeta}>{item.meta}</Text> : null}
      </View>
      <Pressable
        onPress={() => onDelete(item.id)}
        disabled={pending}
        hitSlop={10}
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.deletePressed]}
        accessibilityLabel={`Delete ${item.name}`}
      >
        {pending ? <LoadingIcon size={16} /> : <TrashIcon size={16} />}
      </Pressable>
    </View>
  );

  if (!opacityValue) return content;
  return (
    <Animated.View style={{ opacity: opacityValue }}>{content}</Animated.View>
  );
}

/* A falling or restoring row. Owns its shared value via a hook (correct
 * Reanimated pattern) and starts animating on mount. */
function OverlayRow({
  entry,
  spinDeg,
  color,
  duration,
  isFalling,
  onComplete,
  onRestoreComplete,
}: {
  entry: OverlayEntry;
  spinDeg: number;
  color: string;
  duration: number;
  isFalling: boolean;
  onComplete: (id: string) => void;
  onRestoreComplete: (id: string) => void;
}) {
  const progress = useSharedValue(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const durationMs = Math.round(duration * 1000);
    progress.value = withDelay(
      entry.delayMs,
      withTiming(
        1,
        {
          duration: durationMs,
          // Falling accelerates in; restoring decelerates out.
          easing: isFalling
            ? ReanimatedEasing.in(ReanimatedEasing.cubic)
            : ReanimatedEasing.out(ReanimatedEasing.cubic),
        },
        (finished) => {
          if (!finished) return;
          runOnJS(isFalling ? onComplete : onRestoreComplete)(entry.id);
        },
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(
    () => {
      const p = progress.value;
      return {
        transform: [
          { translateY: isFalling ? p * entry.fallDist : (1 - p) * entry.fallDist },
          { rotate: `${isFalling ? p * spinDeg : (1 - p) * spinDeg}deg` },
          { scale: isFalling ? 1 - 0.85 * p : 0.15 + 0.85 * p },
        ],
        opacity: isFalling ? 1 - 0.92 * p : p,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isFalling, entry.fallDist, spinDeg],
  );

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: entry.rect.x,
          top: entry.rect.y,
          width: entry.rect.w,
          height: entry.rect.h,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: '#0f0f0f',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: rgba(color, 0.35),
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconChip,
          { backgroundColor: rgba(kindColor(entry.item.kind, color), 0.16) },
        ]}
      >
        <KindIcon kind={entry.item.kind} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.item.name}
        </Text>
        {entry.item.meta ? (
          <Text style={styles.rowMeta}>{entry.item.meta}</Text>
        ) : null}
      </View>
    </Reanimated.View>
  );
}

/* The black hole itself: glowing rim, swirling mouth, orbiting debris. */
function Bin({
  mouthColor,
  swirl,
  pulse,
}: {
  mouthColor: string;
  swirl: Reanimated.SharedValue<number>;
  pulse: Reanimated.SharedValue<number>;
}) {
  const debris = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        angle: (i / 10) * Math.PI * 2,
        size: 2 + (i % 3),
      })),
    [],
  );

  const swirlStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swirl.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.12 * pulse.value }],
  }));

  return (
    <Reanimated.View
      style={[
        styles.bin,
        { borderColor: mouthColor, shadowColor: mouthColor },
        pulseStyle,
      ]}
    >
      {/* Swirling vortex mouth */}
      <Reanimated.View
        style={[styles.binSwirl, { borderColor: mouthColor }, swirlStyle]}
      />
      <View style={styles.binCore} />
      <View style={styles.binCoreInner} />

      {/* Orbiting heated debris */}
      <Reanimated.View style={[styles.binOrbit, swirlStyle]}>
        {debris.map((d, i) => (
          <View
            key={i}
            style={[
              styles.binDebris,
              {
                width: d.size,
                height: d.size,
                backgroundColor: i % 3 === 0 ? '#fff3e0' : mouthColor,
                transform: [{ rotate: `${(d.angle * 180) / Math.PI}deg` }],
              },
            ]}
          />
        ))}
      </Reanimated.View>
    </Reanimated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#080808',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1f1f1f',
    padding: 14,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  count: {
    color: '#6b6b6b',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#0f0f0f',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1c1c1c',
  },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  icon: { fontSize: 17 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllBtn: { alignSelf: 'flex-start', marginBottom: 4, paddingHorizontal: 6, paddingVertical: 2 },
  selectAllText: { color: '#6b6b6b', fontSize: 11, fontWeight: '600' },
  deleteSelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#161616',
  },
  deleteSelPressed: { backgroundColor: '#1f1f1f' },
  deleteSelText: { color: '#ff8a3d', fontSize: 12, fontWeight: '600' },
  checkBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkBtnOn: { backgroundColor: '#ff8a3d', borderColor: '#ff8a3d' },
  checkPressed: { opacity: 0.8 },
  rowText: { flex: 1 },
  rowName: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  rowMeta: { color: '#777', fontSize: 11, marginTop: 1 },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161616',
  },
  deletePressed: { backgroundColor: '#1f1f1f' },
  deleteIcon: { fontSize: 16 },
  empty: {
    color: '#6b6b6b',
    fontSize: 13,
    paddingVertical: 24,
    textAlign: 'center',
  },
  binAnchor: {
    alignItems: 'center',
    marginTop: 16,
  },
  bin: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    backgroundColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binSwirl: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 6,
    borderStyle: 'dashed',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    opacity: 0.9,
  },
  binCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  binCoreInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#050505',
  },
  binOrbit: {
    position: 'absolute',
    width: 78,
    height: 78,
  },
  binDebris: {
    position: 'absolute',
    left: 37,
    top: -2,
    borderRadius: 3,
    shadowColor: '#fff3e0',
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111',
    borderWidth: StyleSheet.hairlineWidth,
  },
  snackText: { color: '#ddd', fontSize: 13 },
  undoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  undoText: { fontSize: 13, fontWeight: '700' },
});

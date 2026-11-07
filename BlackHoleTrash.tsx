/**
 * BlackHoleTrash.tsx
 *
 * A from-scratch "select → black hole" component for React Native.
 *
 * Behavior:
 *  - Each list item is selectable (tap the row or its checkbox circle).
 *  - A trash icon sits at the bottom of the card. When items are selected
 *    it glows ("armed").
 *  - Tapping the trash icon makes it transform into a black hole: the icon
 *    scales up, spins and dissolves while a vortex pops into existence at
 *    the same spot.
 *  - Every selected item then disintegrates into particles at its position.
 *  - The particles are driven by real gravitational physics: each one gets
 *    an orbital (tangential) velocity and is pulled by an inverse-square
 *    acceleration toward the hole. They spiral inward like accretion,
 *    stretching into streaks as they accelerate, and are consumed when they
 *    cross the event horizon — each consumption flashes the hole and grows
 *    it slightly (it gains "mass").
 *  - The black hole stays in place and becomes the new delete trigger:
 *    select more items and tap it again to consume another round.
 *
 * Requirements:
 *  - react-native >= 0.71
 *  - react-native-reanimated >= 3.x (wrap your app in <ReanimatedRoot>
 *    when using Reanimated >= 3.16)
 *
 * Usage:
 *
 *   <BlackHoleTrash
 *     color="#ff8a3d"
 *     particlesPerItem={40}
 *     defaultItems={myItems}
 *     onDelete={(deleted) => {}}
 *     onItemsChange={(items) => {}}
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
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type BlackHoleTrashItem = {
  id: string;
  name: string;
  meta?: string;
  kind?: string;
};

export type BlackHoleTrashProps = {
  /** Accent colour of the hole's rim, flashes and heated debris. */
  color?: string;
  /** Particles each selected item disintegrates into. */
  particlesPerItem?: number;
  /** Gravitational constant (px^3 / s^2). Higher = faster plunge. */
  gravity?: number;
  /** Multiplier for each particle's orbital (tangential) velocity. */
  spin?: number;
  /** Items to list (controlled). Pair with onItemsChange. */
  items?: BlackHoleTrashItem[];
  /** Items listed at the start when uncontrolled. */
  defaultItems?: BlackHoleTrashItem[];
  /** Called with the new list after a consumption. */
  onItemsChange?: (items: BlackHoleTrashItem[]) => void;
  /** Called with the items that were consumed. */
  onDelete?: (deleted: BlackHoleTrashItem[]) => void;
  /** Width of the card. */
  width?: number;
  /** Extra styles for the card. */
  style?: StyleProp<ViewStyle>;
};

/** Sample file list. */
export const SAMPLE_FILES: BlackHoleTrashItem[] = [
  { id: '1', name: 'Board update.key', meta: 'Keynote · 24.8 MB', kind: 'slides' },
  { id: '2', name: 'Invoice 1042.pdf', meta: 'PDF · 312 KB', kind: 'pdf' },
  { id: '3', name: 'Sunset at Big Sur.heic', meta: 'Image · 4.1 MB', kind: 'image' },
  { id: '4', name: 'Old builds.zip', meta: 'Archive · 1.2 GB', kind: 'archive' },
  { id: '5', name: 'Notes from call.txt', meta: 'Text · 2 KB', kind: 'text' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const KIND_ICON: Record<string, string> = {
  slides: '📊',
  pdf: '📄',
  image: '🖼️',
  archive: '📦',
  text: '📝',
  key: '🔑',
  audio: '🎵',
  video: '🎬',
  code: '💻',
};

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

function kindIcon(kind?: string): string {
  return (kind && KIND_ICON[kind]) || '📄';
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
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  xv: Animated.Value;
  yv: Animated.Value;
  rv: Animated.Value; // streak rotation (radians)
  sv: Animated.Value; // streak scale (speed stretch)
  ov: Animated.Value; // opacity (fades near the horizon)
};

type Phase = 'idle' | 'transforming' | 'consuming' | 'done';

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function BlackHoleTrash({
  color = '#ff8a3d',
  particlesPerItem = 40,
  gravity = 2.5e7,
  spin = 1,
  items: controlledItems,
  defaultItems = SAMPLE_FILES,
  onItemsChange,
  onDelete,
  width = 380,
  style,
}: BlackHoleTrashProps) {
  /* ---------- list & selection ---------- */
  const isControlled = controlledItems !== undefined;
  const [list, setList] = useState<BlackHoleTrashItem[]>(
    isControlled ? (controlledItems as BlackHoleTrashItem[]) : defaultItems,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [dissolving, setDissolving] = useState<string[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [armedPulse, setArmedPulse] = useState(0); // bump to restart armed glow

  useEffect(() => {
    if (isControlled) {
      setList(controlledItems as BlackHoleTrashItem[]);
      setSelected([]);
      setPhase('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledItems]);

  /* ---------- geometry ---------- */
  const rowRects = useRef<Record<string, Rect>>({});
  const trashRect = useRef<Rect | null>(null);

  const handleRowLayout = useCallback((id: string) => {
    return (e: LayoutChangeEvent) => {
      const { x, y, width: w, height: h } = e.nativeEvent.layout;
      rowRects.current[id] = { x, y, w, h };
    };
  }, []);

  const handleTrashLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    trashRect.current = { x, y, w, h };
  }, []);

  /* ---------- hole (reanimated) ---------- */
  const holeScale = useSharedValue(0); // pop-in scale
  const holeR = useSharedValue(26); // current event-horizon radius
  const flash = useSharedValue(0); // consume flash ring
  const swirl = useSharedValue(0); // continuous mouth rotation
  const shake = useSharedValue(0); // no-selection shake
  const trashOut = useSharedValue(1); // trash icon opacity during transform
  const trashSpin = useSharedValue(0); // trash icon rotation during transform

  const baseHoleR = 26;

  // Continuous swirl of the mouth.
  useEffect(() => {
    let stopped = false;
    const start = () => {
      if (stopped) return;
      swirl.value = withTiming(360, { duration: 3600, easing: ReanimatedEasing.linear }, (finished) => {
        if (finished && !stopped) {
          swirl.value = 0;
          start();
        }
      });
    };
    start();
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- physics state ---------- */
  const particlesRef = useRef<Particle[]>([]);
  const massRef = useRef(1);
  const consumedRef = useRef(0);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTsRef = useRef(0);
  const dissolveTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep rendered particles in sync with the physics ref.
  const syncParticles = useCallback(() => {
    setParticles(particlesRef.current.slice());
  }, []);

  const consumeParticle = useCallback(
    (p: Particle) => {
      consumedRef.current += 1;
      massRef.current += 1 / Math.max(1, particlesPerItem);
      const newR = baseHoleR * (1 + 0.06 * Math.log(1 + massRef.current));
      holeR.value = withTiming(newR, { duration: 280 });
      flash.value = withSequence(
        withTiming(1, { duration: 160 }),
        withTiming(0, { duration: 320 }),
      );
      const idx = particlesRef.current.indexOf(p);
      if (idx >= 0) particlesRef.current.splice(idx, 1);
      syncParticles();
    },
    [holeR, flash, particlesPerItem, syncParticles],
  );

  /* ---------- physics loop ---------- */
  const tick = useCallback(
    (ts: number) => {
      const now = ts;
      const dt = Math.min((now - lastTsRef.current) / 1000, 1 / 30);
      lastTsRef.current = now;

      const hx = trashRect.current ? trashRect.current.x + trashRect.current.w / 2 : 0;
      const hy = trashRect.current ? trashRect.current.y + trashRect.current.h / 2 : 0;
      const rHorizon = holeR.value;
      const G = gravity * massRef.current;

      let remaining = 0;
      for (const p of particlesRef.current) {
        const dx = hx - p.x;
        const dy = hy - p.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r < rHorizon) {
          consumeParticle(p);
          continue;
        }
        remaining++;

        // Inverse-square gravity toward the hole.
        const a = Math.min(G / (r * r), 9000);
        const ax = (dx / r) * a;
        const ay = (dy / r) * a;

        // Drag so orbits decay and particles eventually plunge.
        const drag = Math.pow(0.72, dt); // ~0.72^s
        p.vx = (p.vx + ax * dt) * drag;
        p.vy = (p.vy + ay * dt) * drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        p.rv.setValue(Math.atan2(p.vy, p.vx));
        p.sv.setValue(1 + Math.min(speed / 260, 5));
        p.ov.setValue(Math.max(0, Math.min(1, (r - rHorizon) / 26)));
        p.xv.setValue(p.x);
        p.yv.setValue(p.y);
      }

      if (remaining > 0 || particlesRef.current.length > 0) {
        rafRef.current = setTimeout(() => tick(performance.now()), 16) as unknown as ReturnType<typeof setTimeout>;
      } else {
        rafRef.current = null;
        finishConsuming();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gravity, consumeParticle],
  );

  /* ---------- spawning ---------- */
  const spawnParticles = useCallback(
    (rect: Rect, item: BlackHoleTrashItem) => {
      const hx = trashRect.current ? trashRect.current.x + trashRect.current.w / 2 : rect.x + rect.w / 2;
      const hy = trashRect.current ? trashRect.current.y + trashRect.current.h / 2 : rect.y + rect.h;
      const count = Math.max(1, Math.floor(particlesPerItem));
      const mass = massRef.current;

      for (let i = 0; i < count; i++) {
        // Disintegrate across the whole item area.
        const px = rect.x + Math.random() * rect.w;
        const py = rect.y + Math.random() * rect.h;
        const dx = hx - px;
        const dy = hy - py;
        const r = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

        // Orbital (tangential) velocity, slightly biased inward.
        const v = Math.sqrt((gravity * mass) / r) * spin;
        const tx = -dy / r;
        const ty = dx / r;
        const vx = (tx * v + (dx / r) * -0.15 * v) * (0.85 + Math.random() * 0.3);
        const vy = (ty * v + (dy / r) * -0.15 * v) * (0.85 + Math.random() * 0.3);

        const roll = Math.random();
        const palette =
          roll < 0.5 ? color : roll < 0.8 ? '#fff3e0' : rgba(color, 0.55);

        const p: Particle = {
          id: `${item.id}-${i}`,
          x: px,
          y: py,
          vx,
          vy,
          size: 2 + Math.random() * 3,
          color: roll < 0.2 ? kindColor(item.kind, color) : palette,
          xv: new Animated.Value(px),
          yv: new Animated.Value(py),
          rv: new Animated.Value(0),
          sv: new Animated.Value(1),
          ov: new Animated.Value(1),
        };
        particlesRef.current.push(p);
      }
      syncParticles();
    },
    [gravity, spin, particlesPerItem, color, syncParticles],
  );

  /* ---------- consumption flow ---------- */
  const finishConsuming = useCallback(() => {
    const consumed = selected.filter((id) => list.some((it) => it.id === id));
    const ids = consumed.map((it) => it.id);
    const nextList = list.filter((it) => !ids.includes(it.id));
    setList(nextList);
    setSelected([]);
    setDissolving([]);
    setPhase('done');
    setArmedPulse((k) => k + 1);

    onDelete?.(consumed);
    onItemsChange?.(nextList);
  }, [selected, list, onDelete, onItemsChange]);

  const startConsuming = useCallback(() => {
    if (phase === 'consuming' || phase === 'transforming') return;
    if (selected.length === 0) {
      // Nothing selected: shake the trash icon.
      shake.value = withSequence(
        withTiming(1, { duration: 90 }),
        withTiming(-1, { duration: 90 }),
        withTiming(1, { duration: 90 }),
        withTiming(0, { duration: 90 }),
      );
      return;
    }

    setPhase('consuming');
    consumedRef.current = 0;
    const targets = selected.slice();

    // Disintegrate each selected item in a cascade.
    targets.forEach((id, i) => {
      const timer = setTimeout(() => {
        const item = list.find((it) => it.id === id);
        if (!item) return;
        const rect = rowRects.current[id];
        if (rect) {
          spawnParticles(rect, item);
        }
        setDissolving((prev) => (prev.includes(id) ? prev : [...prev, id]));
      }, i * 140);
      dissolveTimers.current.push(timer);
    });

    // Physics loop.
    lastTsRef.current = performance.now();
    rafRef.current = setTimeout(() => tick(lastTsRef.current), 16) as unknown as ReturnType<typeof setTimeout>;
  }, [phase, selected, list, spawnParticles, shake, tick]);

  /* ---------- trash → black hole transformation ---------- */
  const triggerTransform = useCallback(() => {
    if (phase !== 'idle') return;
    if (selected.length === 0) {
      shake.value = withSequence(
        withTiming(1, { duration: 90 }),
        withTiming(-1, { duration: 90 }),
        withTiming(1, { duration: 90 }),
        withTiming(0, { duration: 90 }),
      );
      return;
    }
    setPhase('transforming');
    // Trash icon spins up and dissolves.
    trashSpin.value = withTiming(220, { duration: 480, easing: ReanimatedEasing.in(ReanimatedEasing.cubic) });
    trashOut.value = withTiming(0, { duration: 480, delay: 120 });
    // The hole pops in at the same spot.
    holeScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    setTimeout(startConsuming, 480);
  }, [phase, selected, shake, holeScale, trashSpin, trashOut, startConsuming]);

  // Tap target: the trash icon (idle) or the black hole (done).
  const handleTriggerPress = useCallback(() => {
    if (phase === 'idle') {
      triggerTransform();
    } else if (phase === 'done') {
      startConsuming();
    }
  }, [phase, triggerTransform, startConsuming]);

  /* ---------- selection ---------- */
  const toggleSelect = useCallback(
    (id: string) => {
      if (phase === 'consuming' || phase === 'transforming') return;
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [phase],
  );

  /* ---------- cleanup ---------- */
  useEffect(() => {
    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
      dissolveTimers.current.forEach(clearTimeout);
    };
  }, []);

  /* ---------- render ---------- */
  const cardWidth = Math.min(width, 360);
  const holePos = trashRect.current;
  const holeStyle = holePos
    ? {
        position: 'absolute' as const,
        left: holePos.x + holePos.w / 2 - holeR.value,
        top: holePos.y + holePos.h / 2 - holeR.value,
      }
    : { position: 'absolute' as const };

  const armed = phase !== 'consuming' && phase !== 'transforming' && selected.length > 0;

  return (
    <View style={[styles.card, { width: cardWidth }, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Files</Text>
        <Text style={styles.count}>
          {list.length} files{selected.length > 0 ? ` · ${selected.length} selected` : ''}
        </Text>
      </View>

      {/* Selectable list */}
      {list.length === 0 ? (
        <Text style={styles.empty}>No files</Text>
      ) : (
        list.map((item) => {
          const isSel = selected.includes(item.id);
          const isDissolving = dissolving.includes(item.id);
          return (
            <RowView
              key={item.id}
              item={item}
              color={color}
              selected={isSel}
              dissolving={isDissolving}
              onToggle={() => toggleSelect(item.id)}
              onLayout={handleRowLayout(item.id)}
            />
          );
        })
      )}

      {/* Trash trigger / black hole */}
      <View style={styles.triggerAnchor}>
        {phase === 'idle' ? (
          <Reanimated.View
            style={[
              styles.trashBtn,
              armed ? { borderColor: color, shadowColor: color } : null,
              {
                opacity: trashOut,
                transform: [{ rotate: `${trashSpin.value}deg` }, { scale: 1 + 0.25 * (1 - trashOut.value) }],
              },
            ]}
          >
            <Text style={styles.trashIcon}>🗑️</Text>
          </Reanimated.View>
        ) : (
          <Pressable
            onPress={handleTriggerPress}
            hitSlop={12}
            accessibilityLabel="Black hole — tap to consume selected files"
            style={StyleSheet.absoluteFill}
          >
            <Reanimated.View
              style={[
                styles.hole,
                { width: holeR.value * 2, height: holeR.value * 2, borderColor: color, shadowColor: color },
                { transform: [{ scale: holeScale.value }] },
                holeStyle,
              ]}
            >
              {/* Consuming flash ring */}
              <Reanimated.View
                style={[
                  styles.holeFlash,
                  { borderColor: color },
                  {
                    transform: [{ scale: 1 + 1.4 * flash.value }],
                    opacity: 0.75 * (1 - flash.value),
                  },
                ]}
              />
              {/* Swirling mouth */}
              <Reanimated.View
                style={[styles.holeSwirl, { borderColor: color }, { transform: [{ rotate: `${swirl.value}deg` }] }]}
              />
              <View style={styles.holeCore} />
              <View style={styles.holeCoreInner} />
            </Reanimated.View>
          </Pressable>
        )}
        {armed ? (
          <Reanimated.View
            key={armedPulse}
            style={[styles.armedRing, { borderColor: color }]}
          >
            <Text style={[styles.armedText, { color }]}>Tap the void to consume</Text>
          </Reanimated.View>
        ) : null}
      </View>

      {/* Particle layer */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {particles.map((p) => (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                shadowColor: p.color,
                shadowOpacity: 0.8,
                shadowRadius: 4,
                elevation: 6,
              },
              {
                transform: [
                  { translateX: p.xv },
                  { translateY: p.yv },
                  { rotate: p.rv },
                  { scaleX: p.sv },
                ],
                opacity: p.ov,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

type RowViewProps = {
  item: BlackHoleTrashItem;
  color: string;
  selected: boolean;
  dissolving: boolean;
  onToggle: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
};

function RowView({ item, color, selected, dissolving, onToggle, onLayout }: RowViewProps) {
  const dissolve = useSharedValue(1);

  useEffect(() => {
    if (dissolving) {
      dissolve.value = withTiming(0.25, { duration: 380, easing: ReanimatedEasing.in(ReanimatedEasing.cubic) });
    }
  }, [dissolving, dissolve]);

  const dissolveStyle = useAnimatedStyle(() => ({
    opacity: dissolve.value,
    transform: [{ scale: dissolve.value }],
  }));

  return (
    <Reanimated.View
      style={[
        styles.row,
        selected ? { borderColor: color, backgroundColor: rgba(color, 0.07) } : null,
        dissolving ? dissolveStyle : null,
      ]}
      onLayout={onLayout}
    >
      <Pressable onPress={onToggle} hitSlop={8} style={styles.selectBtn} accessibilityLabel={`Select ${item.name}`}>
        <View style={[styles.selectCircle, selected ? { borderColor: color, backgroundColor: color } : null]}>
          {selected ? <Text style={styles.selectCheck}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={[styles.iconChip, { backgroundColor: rgba(kindColor(item.kind, color), 0.16) }]}>
        <Text style={styles.icon}>{kindIcon(item.kind)}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
        {item.meta ? <Text style={styles.rowMeta}>{item.meta}</Text> : null}
      </View>
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
  title: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  count: { color: '#6b6b6b', fontSize: 12 },
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
  selectBtn: { padding: 2 },
  selectCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCheck: { color: '#000', fontSize: 13, fontWeight: '800' },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  icon: { fontSize: 17 },
  rowText: { flex: 1 },
  rowName: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  rowMeta: { color: '#777', fontSize: 11, marginTop: 1 },
  empty: { color: '#6b6b6b', fontSize: 13, paddingVertical: 24, textAlign: 'center' },
  triggerAnchor: {
    alignItems: 'center',
    marginTop: 18,
    minHeight: 96,
    justifyContent: 'flex-end',
  },
  trashBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  trashIcon: { fontSize: 24 },
  armedRing: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  armedText: { fontSize: 11, fontWeight: '700' },
  hole: {
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: '#000000',
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holeFlash: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
  },
  holeSwirl: {
    position: 'absolute',
    width: '72%',
    height: '72%',
    borderRadius: 999,
    borderWidth: 5,
    borderStyle: 'dashed',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    opacity: 0.9,
  },
  holeCore: {
    width: '60%',
    height: '60%',
    borderRadius: 999,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  holeCoreInner: {
    width: '38%',
    height: '38%',
    borderRadius: 999,
    backgroundColor: '#050505',
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
  },
});

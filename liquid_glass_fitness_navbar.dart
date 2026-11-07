// ============================================================================
// liquid_glass_fitness_navbar.dart
//
// Apple iOS 26 / iOS 27 Liquid Glass Navigation Bar & Fitness Tracker App
// powered by `liquid_glass_renderer` (https://pub.dev/packages/liquid_glass_renderer)
// plus React Native Liquid Glass Button hybrid bridge.
//
// Add to pubspec.yaml:
//   dependencies:
//     flutter:
//       sdk: flutter
//     liquid_glass_renderer: ^0.2.0 # or ^1.0.0-dev
//
// Run with Impeller + Flutter GPU enabled for full real-time bevel refraction:
//   flutter run --enable-impeller --enable-flutter-gpu
// ============================================================================

import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter/services.dart';
import 'package:liquid_glass_renderer/liquid_glass_renderer.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Precache the Liquid Glass shaders & GPU pipeline before mounting UI
  await LiquidGlass.precache();
  runApp(const FitnessLiquidGlassApp());
}

// ============================================================================
// DESIGN TOKENS — APPLE FITNESS & LIQUID GLASS PALETTE
// ============================================================================

class FitnessColors {
  static const Color background = Color(0xFF05060A);
  static const Color cardSurface = Color(0xB8161824);
  static const Color moveRed = Color(0xFFFA114F);
  static const Color exerciseLime = Color(0xFFA6FF00);
  static const Color standCyan = Color(0xFF00F5EA);
  static const Color heartRose = Color(0xFFFF2D55);
  static const Color sharingAmber = Color(0xFFFF9F0A);
}

// ============================================================================
// DATA MODELS
// ============================================================================

@immutable
class FitnessNavTab {
  final String id;
  final String label;
  final IconData icon;
  final Color accentColor;
  final int? badge;

  const FitnessNavTab({
    required this.id,
    required this.label,
    required this.icon,
    required this.accentColor,
    this.badge,
  });
}

@immutable
class WorkoutPreset {
  final String id;
  final String title;
  final String subtitle;
  final int targetKcal;
  final String duration;
  final IconData icon;
  final Color accent;

  const WorkoutPreset({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.targetKcal,
    required this.duration,
    required this.icon,
    required this.accent,
  });
}

// ============================================================================
// HYBRID REACT NATIVE <-> FLUTTER BRIDGE
// ============================================================================

/// Bridges the Flutter `liquid_glass_renderer` Navigation Bar with the
/// React Native `LiquidGlassButton` component over MethodChannel.
class ReactNativeLiquidGlassBridge {
  static const MethodChannel _channel =
      MethodChannel('com.fitness.liquidglass/nav');

  static void registerHandler({
    required ValueChanged<String> onTabRequestedFromRN,
    required ValueChanged<String> onWorkoutTriggeredFromRN,
  }) {
    _channel.setMethodCallHandler((MethodCall call) async {
      switch (call.method) {
        case 'onTabSelected':
          final tabId = call.arguments as String?;
          if (tabId != null) onTabRequestedFromRN(tabId);
          break;
        case 'onButtonPressed':
          final map = call.arguments as Map<dynamic, dynamic>?;
          final id = map?['buttonId']?.toString() ?? 'workout_cta';
          onWorkoutTriggeredFromRN(id);
          break;
      }
    });
  }

  static Future<void> notifyTabChanged(String tabId) async {
    try {
      await _channel.invokeMethod('onTabChanged', {'tabId': tabId});
    } catch (_) {
      // Safe no-op when running standalone without a React Native host
    }
  }

  static Future<void> notifyQuickAction(bool isWorkoutActive) async {
    try {
      await _channel.invokeMethod('onQuickAction', {'active': isWorkoutActive});
    } catch (_) {}
  }
}

// ============================================================================
// ROOT APP WIDGET
// ============================================================================

class FitnessLiquidGlassApp extends StatelessWidget {
  const FitnessLiquidGlassApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Apple Fitness Liquid Glass',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: FitnessColors.background,
      ),
      home: const FitnessTrackerHomeScreen(),
    );
  }
}

// ============================================================================
// MAIN FITNESS TRACKER SCREEN WITH LIQUID GLASS NAVIGATION BAR
// ============================================================================

class FitnessTrackerHomeScreen extends StatefulWidget {
  const FitnessTrackerHomeScreen({super.key});

  @override
  State<FitnessTrackerHomeScreen> createState() =>
      _FitnessTrackerHomeScreenState();
}

class _FitnessTrackerHomeScreenState extends State<FitnessTrackerHomeScreen> {
  static const List<FitnessNavTab> _tabs = [
    FitnessNavTab(
      id: 'summary',
      label: 'Summary',
      icon: CupertinoIcons.circle_grid_hex_fill,
      accentColor: FitnessColors.moveRed,
    ),
    FitnessNavTab(
      id: 'workouts',
      label: 'Workouts',
      icon: CupertinoIcons.flame_fill,
      accentColor: FitnessColors.exerciseLime,
      badge: 2,
    ),
    FitnessNavTab(
      id: 'activity',
      label: 'Activity',
      icon: CupertinoIcons.bolt_horizontal_circle_fill,
      accentColor: FitnessColors.standCyan,
    ),
    FitnessNavTab(
      id: 'heart',
      label: 'Heart',
      icon: CupertinoIcons.heart_fill,
      accentColor: FitnessColors.heartRose,
    ),
    FitnessNavTab(
      id: 'sharing',
      label: 'Sharing',
      icon: CupertinoIcons.person_2_fill,
      accentColor: FitnessColors.sharingAmber,
    ),
  ];

  static const List<WorkoutPreset> _workouts = [
    WorkoutPreset(
      id: 'run',
      title: 'Outdoor Run',
      subtitle: 'VO₂ Max & Split Pace Tracking',
      targetKcal: 420,
      duration: '35 min',
      icon: CupertinoIcons.speedometer,
      accent: FitnessColors.exerciseLime,
    ),
    WorkoutPreset(
      id: 'hiit',
      title: 'HIIT Metabolic Intervals',
      subtitle: 'Zone 4–5 Anaerobic Conditioning',
      targetKcal: 390,
      duration: '25 min',
      icon: CupertinoIcons.flame_fill,
      accent: FitnessColors.moveRed,
    ),
    WorkoutPreset(
      id: 'cycle',
      title: 'Indoor Cycling',
      subtitle: 'FTP Power & Cadence Sensor',
      targetKcal: 510,
      duration: '45 min',
      icon: CupertinoIcons.compass_fill,
      accent: FitnessColors.standCyan,
    ),
    WorkoutPreset(
      id: 'strength',
      title: 'Functional Strength',
      subtitle: 'Full-Body Progressive Overload',
      targetKcal: 310,
      duration: '40 min',
      icon: CupertinoIcons.bolt_fill,
      accent: FitnessColors.sharingAmber,
    ),
  ];

  int _selectedIndex = 0;
  double _glassTintSlider = 0.35; // iOS 27 Liquid Glass tintAmount (0 = Clear, 1 = Tinted)
  bool _useFakeGlassFallback = false;
  WorkoutPreset? _activeWorkout;

  // Live Fitness Metrics
  int _moveKcal = 640;
  final int _moveGoal = 750;
  int _exerciseMin = 42;
  final int _exerciseGoal = 45;
  int _standHours = 10;
  final int _standGoal = 12;
  int _liveHeartRate = 122;
  Timer? _biometricTimer;

  @override
  void initState() {
    super.initState();
    ReactNativeLiquidGlassBridge.registerHandler(
      onTabRequestedFromRN: (tabId) {
        final idx = _tabs.indexWhere((t) => t.id == tabId);
        if (idx != -1 && mounted) {
          setState(() => _selectedIndex = idx);
        }
      },
      onWorkoutTriggeredFromRN: (workoutId) {
        if (!mounted) return;
        setState(() {
          _activeWorkout =
              _activeWorkout == null ? _workouts.first : null;
        });
      },
    );

    _biometricTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      if (_activeWorkout != null && mounted) {
        setState(() {
          _moveKcal += 2;
          _liveHeartRate = (128 + (math.Random().nextInt(14) - 6)).clamp(110, 178);
        });
      }
    });
  }

  @override
  void dispose() {
    _biometricTimer?.cancel();
    super.dispose();
  }

  void _handleTabSelected(int index) {
    HapticFeedback.selectionClick();
    setState(() => _selectedIndex = index);
    ReactNativeLiquidGlassBridge.notifyTabChanged(_tabs[index].id);
  }

  void _handleQuickActionOrbTap() {
    HapticFeedback.mediumImpact();
    if (_activeWorkout != null) {
      setState(() => _activeWorkout = null);
      ReactNativeLiquidGlassBridge.notifyQuickAction(false);
    } else {
      _showQuickWorkoutSheet();
    }
  }

  void _showQuickWorkoutSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return LiquidGlassLayer(
          fake: _useFakeGlassFallback,
          settings: LiquidGlassSettings.ios27Regular(
            brightness: Brightness.dark,
            tintAmount: 0.65,
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: LiquidGlass(
              shape: const LiquidRoundedSuperellipse(borderRadius: 34),
              child: Container(
                padding: const EdgeInsets.all(22),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Quick-Start Workout',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Select a workout to activate the Liquid Glass Live Accessory capsule',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.68),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 16),
                    for (final preset in _workouts)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: GestureDetector(
                          onTap: () {
                            Navigator.of(context).pop();
                            setState(() => _activeWorkout = preset);
                            ReactNativeLiquidGlassBridge.notifyQuickAction(true);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: preset.accent.withValues(alpha: 0.45),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(preset.icon, color: preset.accent, size: 26),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        preset.title,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 16,
                                        ),
                                      ),
                                      Text(
                                        '${preset.duration} • ${preset.targetKcal} KCAL',
                                        style: TextStyle(
                                          color: Colors.white.withValues(alpha: 0.65),
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(
                                  CupertinoIcons.play_circle_fill,
                                  color: preset.accent,
                                  size: 28,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeTab = _tabs[_selectedIndex];

    return Scaffold(
      backgroundColor: FitnessColors.background,
      body: Stack(
        children: [
          // ------------------------------------------------------------------
          // 1. AMBIENT GLOWING FITNESS ORBS (Refracted by LiquidGlass bevels)
          // ------------------------------------------------------------------
          const Positioned(
            top: 70,
            left: -60,
            child: _AmbientGlowBlob(color: FitnessColors.moveRed, size: 260),
          ),
          const Positioned(
            top: 340,
            right: -70,
            child: _AmbientGlowBlob(color: FitnessColors.exerciseLime, size: 280),
          ),
          const Positioned(
            bottom: 30,
            left: 30,
            child: _AmbientGlowBlob(color: FitnessColors.standCyan, size: 240),
          ),

          // ------------------------------------------------------------------
          // 2. SCROLLABLE FITNESS TRACKER CONTENT (Scrolls under the glass bar)
          // ------------------------------------------------------------------
          SafeArea(
            bottom: false,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 175),
              children: [
                // Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SATURDAY, NOV 7',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.58),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          activeTab.label,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.6,
                          ),
                        ),
                      ],
                    ),
                    // Top Liquid Glass Pill Button
                    LiquidGlassLayer(
                      fake: _useFakeGlassFallback,
                      settings: LiquidGlassSettings.ios27Regular(
                        brightness: Brightness.dark,
                        tintAmount: _glassTintSlider,
                      ),
                      child: GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          setState(() {
                            _moveKcal = (_moveKcal + 35).clamp(0, 1200);
                            _exerciseMin = (_exerciseMin + 4).clamp(0, 90);
                          });
                        },
                        child: LiquidStretch(
                          interactionScale: 1.06,
                          child: LiquidGlass(
                            shape: const LiquidRoundedSuperellipse(
                              borderRadius: 22,
                            ),
                            appearance: LiquidGlassAppearance.ios27RegularDark(
                              tint: activeTab.accentColor,
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 10,
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    CupertinoIcons.add_circled_solid,
                                    color: activeTab.accentColor,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 6),
                                  const Text(
                                    'Log Ring',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Triple Activity Rings Card
                _ActivityRingsHeroCard(
                  moveProgress: _moveKcal / _moveGoal,
                  exerciseProgress: _exerciseMin / _exerciseGoal,
                  standProgress: _standHours / _standGoal,
                  moveKcal: _moveKcal,
                  moveGoal: _moveGoal,
                  exerciseMin: _exerciseMin,
                  exerciseGoal: _exerciseGoal,
                  standHours: _standHours,
                  standGoal: _standGoal,
                ),

                const SizedBox(height: 16),

                // Interactive iOS 27 Liquid Glass Settings Tuner Card
                _LiquidGlassOpticsCard(
                  tintAmount: _glassTintSlider,
                  fakeGlass: _useFakeGlassFallback,
                  onTintChanged: (val) => setState(() => _glassTintSlider = val),
                  onFakeToggled: (val) =>
                      setState(() => _useFakeGlassFallback = val),
                ),

                const SizedBox(height: 20),

                const Text(
                  'Workouts & Biometrics',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 12),

                // Workout Cards (Scroll these behind the bottom Liquid Glass NavBar!)
                for (final workout in _workouts)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _WorkoutPresetCard(
                      workout: workout,
                      isActive: _activeWorkout?.id == workout.id,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _activeWorkout = _activeWorkout?.id == workout.id
                              ? null
                              : workout;
                        });
                      },
                    ),
                  ),

                const SizedBox(height: 8),

                // Biometric Summary Tiles
                Row(
                  children: [
                    Expanded(
                      child: _BiometricMetricCard(
                        label: 'HEART RATE',
                        value: '$_liveHeartRate',
                        unit: 'BPM',
                        subtitle: 'Resting avg 58 BPM',
                        accent: FitnessColors.heartRose,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: _BiometricMetricCard(
                        label: 'STEPS TODAY',
                        value: '11,840',
                        unit: 'STEPS',
                        subtitle: '9.12 km distance',
                        accent: FitnessColors.standCyan,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ------------------------------------------------------------------
          // 3. FLOATING APPLE LIQUID GLASS NAVIGATION BAR (`liquid_glass_renderer`)
          // ------------------------------------------------------------------
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: AppleFitnessLiquidGlassNavBar(
                  tabs: _tabs,
                  selectedIndex: _selectedIndex,
                  onSelected: _handleTabSelected,
                  tintAmount: _glassTintSlider,
                  fake: _useFakeGlassFallback,
                  activeWorkout: _activeWorkout,
                  liveHeartRate: _liveHeartRate,
                  moveKcal: _moveKcal,
                  onActionOrbTap: _handleQuickActionOrbTap,
                  onStopWorkout: () => setState(() => _activeWorkout = null),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// APPLE FITNESS LIQUID GLASS NAVIGATION BAR (`liquid_glass_renderer`)
// ============================================================================

/// Implements the authentic iOS 26 / iOS 27 Apple Fitness Liquid Glass bottom bar
/// using `liquid_glass_renderer`:
/// - `LiquidGlassCapture` + `LiquidGlassLayer` for single-pass backdrop refraction
/// - `LiquidGlassBlendGroup` so the accessory capsule, tab bar capsule, and
///   detached Quick-Workout orb melt into each other like liquid droplets
/// - Interactive sliding `LiquidGlass.withOwnLayer` Loupe lens that refracts
///   the tab bar beneath it with chromatic dispersion and jelly squash-and-stretch.
class AppleFitnessLiquidGlassNavBar extends StatefulWidget {
  final List<FitnessNavTab> tabs;
  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final double tintAmount;
  final bool fake;
  final WorkoutPreset? activeWorkout;
  final int liveHeartRate;
  final int moveKcal;
  final VoidCallback onActionOrbTap;
  final VoidCallback onStopWorkout;

  const AppleFitnessLiquidGlassNavBar({
    required this.tabs,
    required this.selectedIndex,
    required this.onSelected,
    required this.tintAmount,
    required this.fake,
    required this.activeWorkout,
    required this.liveHeartRate,
    required this.moveKcal,
    required this.onActionOrbTap,
    required this.onStopWorkout,
    super.key,
  });

  static const double barHeight = 64.0;
  static const double accessoryHeight = 50.0;
  static const double orbSize = 64.0;
  static const double gap = 10.0;

  /// Clear, unfrosted refractive lens settings for the sliding tab selection pill
  static const LiquidGlassSettings loupeLensSettings = LiquidGlassSettings(
    refractionHeight: 15,
    refractionAmount: 12,
    refractionFitsShape: false,
    dispersion: -0.32,
    frost: 0,
    contourStrength: 0.35,
    backdropShrink: 0.12,
  );

  static const List<BoxShadow> glassShadows = [
    BoxShadow(
      color: Color(0x38000000),
      blurRadius: 26,
      offset: Offset(0, 10),
    ),
  ];

  @override
  State<AppleFitnessLiquidGlassNavBar> createState() =>
      _AppleFitnessLiquidGlassNavBarState();
}

class _AppleFitnessLiquidGlassNavBarState
    extends State<AppleFitnessLiquidGlassNavBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _loupeController;
  double _currentTabPosition = 0;
  double _dragVelocity = 0;
  bool _isInteracting = false;

  @override
  void initState() {
    super.initState();
    _currentTabPosition = widget.selectedIndex.toDouble();
    _loupeController = AnimationController.unbounded(
      vsync: this,
      value: _currentTabPosition,
    )..addListener(() {
        setState(() {
          _currentTabPosition = _loupeController.value;
          _dragVelocity = _loupeController.velocity;
        });
      });
  }

  @override
  void didUpdateWidget(covariant AppleFitnessLiquidGlassNavBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex && !_isInteracting) {
      _animateLoupeTo(widget.selectedIndex.toDouble());
    }
  }

  void _animateLoupeTo(double targetIndex) {
    final simulation = SpringSimulation(
      const SpringDescription(mass: 0.9, stiffness: 210, damping: 18),
      _currentTabPosition,
      targetIndex,
      _dragVelocity,
    );
    _loupeController.animateWith(simulation);
  }

  void _handleHorizontalDragStart(DragStartDetails details, double width) {
    setState(() => _isInteracting = true);
    _UpdateDragPosition(details.localPosition.dx, width);
  }

  void _handleHorizontalDragUpdate(DragUpdateDetails details, double width) {
    _UpdateDragPosition(details.localPosition.dx, width);
  }

  void _UpdateDragPosition(double dx, double width) {
    final slotWidth = width / widget.tabs.length;
    final rawIndex = (dx / slotWidth) - 0.5;
    final clamped = rawIndex.clamp(0.0, (widget.tabs.length - 1).toDouble());
    _loupeController.value = clamped;
  }

  void _handleHorizontalDragEnd(DragEndDetails details) {
    setState(() => _isInteracting = false);
    final nearestTab =
        _currentTabPosition.round().clamp(0, widget.tabs.length - 1);
    _animateLoupeTo(nearestTab.toDouble());
    widget.onSelected(nearestTab);
  }

  @override
  void dispose() {
    _loupeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activeTab = widget.tabs[widget.selectedIndex];

    // Velocity-based jelly squash & stretch for the Liquid Glass Loupe
    final normalizedSpeed = (_dragVelocity.abs() * 0.045).clamp(0.0, 0.28);
    final scaleX = 1.0 + normalizedSpeed + (_isInteracting ? 0.08 : 0.0);
    final scaleY = 1.0 - (normalizedSpeed * 0.45) + (_isInteracting ? 0.04 : 0.0);

    return LiquidGlassCapture(
      child: LiquidGlassLayer(
        fake: widget.fake,
        settings: LiquidGlassSettings.ios27Regular(
          brightness: Brightness.dark,
          tintAmount: widget.tintAmount,
        ),
        defaultAppearance: const LiquidGlassAppearance.ios27RegularDark(),
        child: LiquidGlassBlendGroup(
          // Shapes within 18 logical px merge like liquid droplets
          blend: 18.0,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Optional Live Workout Mini-Accessory Capsule above the NavBar
              if (widget.activeWorkout != null) ...[
                LiquidStretch(
                  interactionScale: 1.03,
                  child: LiquidGlass.grouped(
                    shape: const LiquidRoundedSuperellipse(
                      borderRadius:
                          AppleFitnessLiquidGlassNavBar.accessoryHeight / 2,
                    ),
                    appearance: LiquidGlassAppearance.ios27RegularDark(
                      tint: widget.activeWorkout!.accent.withValues(alpha: 0.35),
                    ),
                    shadows: AppleFitnessLiquidGlassNavBar.glassShadows,
                    child: SizedBox(
                      height: AppleFitnessLiquidGlassNavBar.accessoryHeight,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: Row(
                          children: [
                            Icon(
                              widget.activeWorkout!.icon,
                              color: widget.activeWorkout!.accent,
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                '${widget.activeWorkout!.title}  •  ${widget.liveHeartRate} BPM  •  ${widget.moveKcal} KCAL',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: widget.onStopWorkout,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: FitnessColors.moveRed
                                      .withValues(alpha: 0.28),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  'END',
                                  style: TextStyle(
                                    color: FitnessColors.moveRed,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],

              // Bottom Row: Main Liquid Glass Tab Capsule + Detached Action Orb
              Row(
                children: [
                  Expanded(
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final totalWidth = constraints.maxWidth;
                        const horizontalPad = 8.0;
                        final innerWidth = totalWidth - (horizontalPad * 2);
                        final slotWidth = innerWidth / widget.tabs.length;
                        final loupeLeft =
                            horizontalPad + (_currentTabPosition * slotWidth);

                        return GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onHorizontalDragStart: (d) =>
                              _handleHorizontalDragStart(d, innerWidth),
                          onHorizontalDragUpdate: (d) =>
                              _handleHorizontalDragUpdate(d, innerWidth),
                          onHorizontalDragEnd: _handleHorizontalDragEnd,
                          child: LiquidStretch(
                            interactionScale: 1.035,
                            child: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                // 1. Grouped Liquid Glass Tab Capsule
                                LiquidGlass.grouped(
                                  shape: const LiquidRoundedSuperellipse(
                                    borderRadius:
                                        AppleFitnessLiquidGlassNavBar.barHeight /
                                            2,
                                  ),
                                  shadows:
                                      AppleFitnessLiquidGlassNavBar.glassShadows,
                                  child: SizedBox(
                                    height:
                                        AppleFitnessLiquidGlassNavBar.barHeight,
                                    width: totalWidth,
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: horizontalPad,
                                        vertical: 5,
                                      ),
                                      child: Row(
                                        children: List.generate(
                                          widget.tabs.length,
                                          (index) {
                                            final tab = widget.tabs[index];
                                            final isSelected =
                                                index == widget.selectedIndex;
                                            return Expanded(
                                              child: GestureDetector(
                                                behavior:
                                                    HitTestBehavior.opaque,
                                                onTap: () =>
                                                    widget.onSelected(index),
                                                child: _TabSlotItem(
                                                  tab: tab,
                                                  isSelected: isSelected,
                                                ),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                    ),
                                  ),
                                ),

                                // 2. Sliding Refractive Liquid Glass Loupe Pill
                                Positioned(
                                  left: loupeLeft,
                                  top: 5,
                                  bottom: 5,
                                  width: slotWidth,
                                  child: IgnorePointer(
                                    child: Transform.scale(
                                      scaleX: scaleX,
                                      scaleY: scaleY,
                                      child: LiquidGlass.withOwnLayer(
                                        fake: widget.fake,
                                        settings: AppleFitnessLiquidGlassNavBar
                                            .loupeLensSettings,
                                        appearance:
                                            LiquidGlassAppearance.ios27RegularDark(
                                          tint: activeTab.accentColor
                                              .withValues(alpha: 0.32),
                                        ),
                                        shape: const LiquidRoundedSuperellipse(
                                          borderRadius: 28,
                                        ),
                                        child: const SizedBox.expand(),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  const SizedBox(width: AppleFitnessLiquidGlassNavBar.gap),

                  // 3. Detached Floating Liquid Glass Action Orb (Merges with capsule when stretched)
                  GestureDetector(
                    onTap: widget.onActionOrbTap,
                    child: LiquidStretch(
                      interactionScale: 1.08,
                      child: LiquidGlass.grouped(
                        shape: const LiquidOval(),
                        appearance: LiquidGlassAppearance.ios27RegularDark(
                          tint: (widget.activeWorkout != null
                                  ? FitnessColors.moveRed
                                  : FitnessColors.exerciseLime)
                              .withValues(alpha: 0.38),
                        ),
                        shadows: AppleFitnessLiquidGlassNavBar.glassShadows,
                        child: SizedBox.square(
                          dimension: AppleFitnessLiquidGlassNavBar.orbSize,
                          child: Icon(
                            widget.activeWorkout != null
                                ? CupertinoIcons.stop_fill
                                : CupertinoIcons.bolt_fill,
                            size: 26,
                            color: widget.activeWorkout != null
                                ? FitnessColors.moveRed
                                : FitnessColors.exerciseLime,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabSlotItem extends StatelessWidget {
  final FitnessNavTab tab;
  final bool isSelected;

  const _TabSlotItem({
    required this.tab,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            AnimatedScale(
              scale: isSelected ? 1.14 : 0.96,
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutBack,
              child: Icon(
                tab.icon,
                size: 22,
                color: isSelected
                    ? tab.accentColor
                    : Colors.white.withValues(alpha: 0.65),
              ),
            ),
            if (tab.badge != null)
              Positioned(
                right: -8,
                top: -4,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4.5,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: FitnessColors.moveRed,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${tab.badge}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 3),
        Text(
          tab.label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: isSelected
                ? Colors.white
                : Colors.white.withValues(alpha: 0.55),
            fontSize: 10.5,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// SUPPORTING FITNESS TRACKER CARDS & CUSTOM PAINTERS
// ============================================================================

class _AmbientGlowBlob extends StatelessWidget {
  final Color color;
  final double size;

  const _AmbientGlowBlob({required this.color, required this.size});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              color.withValues(alpha: 0.34),
              color.withValues(alpha: 0.0),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityRingsHeroCard extends StatelessWidget {
  final double moveProgress;
  final double exerciseProgress;
  final double standProgress;
  final int moveKcal;
  final int moveGoal;
  final int exerciseMin;
  final int exerciseGoal;
  final int standHours;
  final int standGoal;

  const _ActivityRingsHeroCard({
    required this.moveProgress,
    required this.exerciseProgress,
    required this.standProgress,
    required this.moveKcal,
    required this.moveGoal,
    required this.exerciseMin,
    required this.exerciseGoal,
    required this.standHours,
    required this.standGoal,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: FitnessColors.cardSurface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Row(
        children: [
          SizedBox.square(
            dimension: 150,
            child: CustomPaint(
              painter: _AppleActivityRingsPainter(
                moveProgress: moveProgress,
                exerciseProgress: exerciseProgress,
                standProgress: standProgress,
              ),
            ),
          ),
          const SizedBox(width: 22),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _RingMetricRow(
                  label: 'MOVE',
                  value: '$moveKcal/$moveGoal',
                  unit: 'KCAL',
                  color: FitnessColors.moveRed,
                ),
                const SizedBox(height: 10),
                _RingMetricRow(
                  label: 'EXERCISE',
                  value: '$exerciseMin/$exerciseGoal',
                  unit: 'MIN',
                  color: FitnessColors.exerciseLime,
                ),
                const SizedBox(height: 10),
                _RingMetricRow(
                  label: 'STAND',
                  value: '$standHours/$standGoal',
                  unit: 'HRS',
                  color: FitnessColors.standCyan,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RingMetricRow extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final Color color;

  const _RingMetricRow({
    required this.label,
    required this.value,
    required this.unit,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.8,
          ),
        ),
        RichText(
          text: TextSpan(
            text: value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 21,
              fontWeight: FontWeight.w800,
            ),
            children: [
              TextSpan(
                text: ' $unit',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _AppleActivityRingsPainter extends CustomPainter {
  final double moveProgress;
  final double exerciseProgress;
  final double standProgress;

  const _AppleActivityRingsPainter({
    required this.moveProgress,
    required this.exerciseProgress,
    required this.standProgress,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    const strokeWidth = 14.0;
    const gap = 4.0;

    final outerRadius = (size.shortestSide / 2) - (strokeWidth / 2);
    final middleRadius = outerRadius - strokeWidth - gap;
    final innerRadius = middleRadius - strokeWidth - gap;

    _drawRing(
      canvas,
      center: center,
      radius: outerRadius,
      progress: moveProgress,
      color: FitnessColors.moveRed,
      strokeWidth: strokeWidth,
    );
    _drawRing(
      canvas,
      center: center,
      radius: middleRadius,
      progress: exerciseProgress,
      color: FitnessColors.exerciseLime,
      strokeWidth: strokeWidth,
    );
    _drawRing(
      canvas,
      center: center,
      radius: innerRadius,
      progress: standProgress,
      color: FitnessColors.standCyan,
      strokeWidth: strokeWidth,
    );
  }

  void _drawRing(
    Canvas canvas, {
    required Offset center,
    required double radius,
    required double progress,
    required Color color,
    required double strokeWidth,
  }) {
    final trackPaint = Paint()
      ..color = color.withValues(alpha: 0.18)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final arcPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = strokeWidth;

    canvas.drawCircle(center, radius, trackPaint);

    final sweepAngle = (progress.clamp(0.05, 1.25)) * 2 * math.pi;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      arcPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _AppleActivityRingsPainter oldDelegate) {
    return oldDelegate.moveProgress != moveProgress ||
        oldDelegate.exerciseProgress != exerciseProgress ||
        oldDelegate.standProgress != standProgress;
  }
}

class _LiquidGlassOpticsCard extends StatelessWidget {
  final double tintAmount;
  final bool fakeGlass;
  final ValueChanged<double> onTintChanged;
  final ValueChanged<bool> onFakeToggled;

  const _LiquidGlassOpticsCard({
    required this.tintAmount,
    required this.fakeGlass,
    required this.onTintChanged,
    required this.onFakeToggled,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: FitnessColors.cardSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Liquid Glass Optics (iOS 27 Slider)',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Row(
                children: [
                  Text(
                    'FakeGlass',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.65),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 6),
                  CupertinoSwitch(
                    value: fakeGlass,
                    activeTrackColor: FitnessColors.exerciseLime,
                    onChanged: onFakeToggled,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Text(
                'Clear',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
              Expanded(
                child: Slider(
                  value: tintAmount,
                  activeColor: FitnessColors.standCyan,
                  onChanged: onTintChanged,
                ),
              ),
              const Text(
                'Tinted',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WorkoutPresetCard extends StatelessWidget {
  final WorkoutPreset workout;
  final bool isActive;
  final VoidCallback onTap;

  const _WorkoutPresetCard({
    required this.workout,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: FitnessColors.cardSurface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isActive
                ? workout.accent
                : Colors.white.withValues(alpha: 0.10),
            width: isActive ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: workout.accent.withValues(alpha: 0.18),
                shape: BoxShape.circle,
              ),
              child: Icon(workout.icon, color: workout.accent, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    workout.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${workout.duration} • ${workout.targetKcal} KCAL • ${workout.subtitle}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.62),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isActive
                    ? workout.accent
                    : workout.accent.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Text(
                isActive ? 'Active' : 'Start',
                style: TextStyle(
                  color: isActive ? Colors.black : workout.accent,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BiometricMetricCard extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final String subtitle;
  final Color accent;

  const _BiometricMetricCard({
    required this.label,
    required this.value,
    required this.unit,
    required this.subtitle,
    required this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: FitnessColors.cardSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: accent,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 6),
          RichText(
            text: TextSpan(
              text: value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w800,
              ),
              children: [
                TextSpan(
                  text: ' $unit',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

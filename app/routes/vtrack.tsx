import { useEffect, useRef, useState } from "react";
import {
  RiArrowDropDownLine,
  RiArrowDropLeftLine,
  RiArrowDropRightLine,
  RiArrowDropUpLine,
  RiSettings3Line,
  RiCloseLine,
  RiRecordCircleLine,
  RiPlayLine,
  RiStopLine,
} from "react-icons/ri";
import { Button } from "~/components/Button";
import { Box, Center, Flex, Spacer, styled } from "~/styled-system/jsx";

// Default configuration values for realistic drift physics
const DEFAULT_CONFIG = {
  background: {
    imageSrc: "track-2.png",
    width: 2048,
    height: 2048,
    scale: 1.33, // Scale factor for background size
  },

  // Boundary box to contain the car (in pixels, relative to unscaled background)
  boundary: {
    x: 80, // Left edge
    y: 650, // Top edge
    width: 1850, // Width of boundary box
    height: 900, // Height of boundary box
  },
  car: {
    // Vehicle dimensions and properties
    dimensions: { width: 1, length: 2 }, // meters

    // Rigid body vehicle parameters - balanced speed-dependent rotation
    mass: 300, // kg - lighter for maximum low-speed response
    inertiaZ: 180, // kg⋅m² - slightly higher for controlled low-speed rotation
    wheelbase: 1.25, // L - ultra-short for maximum agility
    a: 0.5, // distance from CoM to front axle (meters) - extremely rear-biased
    b: 1.0, // distance from CoM to rear axle (meters) - maximum tail-happy behavior
    trackWidth: 1.5, // w - distance between left/right wheels (meters)

    // Tire properties - reduced front grip for high-speed handling
    corneringStiffnessFront: 38000, // Cα front - further reduced for less high-speed front grip
    corneringStiffnessRear: 18000, // Cα rear - unchanged for oversteer capability
    mu: 0.8, // μ - friction coefficient - reasonable but limited

    // Engine and drivetrain - massive power for guaranteed power oversteer
    maxEngineTorque: 2000, // Nm - increased for a bit more power
    wheelRadius: 0.32, // meters

    // Steering system - reduced sensitivity for better control
    maxSteeringAngle: (82 * Math.PI) / 180, // radians (82 degrees)
    maxInnerWheelAngle: (88 * Math.PI) / 180, // 88 degrees maximum for inside wheel
    steeringRatio: 16, // steering wheel to road wheel ratio
    ackermannRatio: 0.7, // Ackermann factor (0-1) - reduced for less geometry correction
    casterStiffness: 0.9, // kcaster - stronger for better high-speed stability
    steerRate: 1.7, // rad/s - reduced for less sensitive steering

    // Physics integration
    timeStep: 1 / 60, // 60 Hz physics update - more reasonable for frame drops

    // Visual effects
    skidmarkThreshold: 3, // slip angle threshold for skidmarks (degrees)
    skidmarkAlpha: 0.6,
  },

  camera: {
    edgeBufferRatio: 0.4,
    scale: 0.8, // Camera zoom scale - 1.0 is normal, >1.0 zooms in, <1.0 zooms out
  },

  input: {
    throttleKey: "ArrowUp",
    brakeKey: "ArrowDown",
    steerLeftKey: "ArrowLeft",
    steerRightKey: "ArrowRight",
  },
};

// Settings type definition
type Settings = {
  mass: number;
  inertiaZ: number;
  wheelbase: number;
  trackWidth: number;
  corneringStiffnessFront: number;
  corneringStiffnessRear: number;
  mu: number;
  maxEngineTorque: number;
  wheelRadius: number;
  maxSteeringAngle: number;
  maxInnerWheelAngle: number;
  steeringRatio: number;
  ackermannRatio: number;
  casterStiffness: number;
  steerRate: number;
  cameraScale: number;
  flipControls: number; // 0 = normal, 1 = flipped
};

// Settings configuration with ranges and labels
const SETTINGS_CONFIG = {
  mass: {
    min: 200,
    max: 600,
    step: 10,
    label: "Vehicle Mass (kg)",
    unit: "kg",
  },
  inertiaZ: {
    min: 100,
    max: 400,
    step: 10,
    label: "Rotational Inertia (kg⋅m²)",
    unit: "kg⋅m²",
  },
  wheelbase: {
    min: 0.8,
    max: 2.0,
    step: 0.05,
    label: "Wheelbase Length (m)",
    unit: "m",
  },
  trackWidth: {
    min: 1.0,
    max: 2.5,
    step: 0.1,
    label: "Track Width (m)",
    unit: "m",
  },
  corneringStiffnessFront: {
    min: 20000,
    max: 60000,
    step: 1000,
    label: "Front Cornering Stiffness (N/rad)",
    unit: "N/rad",
  },
  corneringStiffnessRear: {
    min: 10000,
    max: 30000,
    step: 1000,
    label: "Rear Cornering Stiffness (N/rad)",
    unit: "N/rad",
  },
  mu: {
    min: 0.3,
    max: 1.2,
    step: 0.05,
    label: "Friction Coefficient",
    unit: "",
  },
  maxEngineTorque: {
    min: 500,
    max: 4000,
    step: 100,
    label: "Max Engine Torque (Nm)",
    unit: "Nm",
  },
  wheelRadius: {
    min: 0.2,
    max: 0.5,
    step: 0.01,
    label: "Wheel Radius (m)",
    unit: "m",
  },
  maxSteeringAngle: {
    min: 30,
    max: 120,
    step: 5,
    label: "Max Steering Angle (degrees)",
    unit: "°",
  },
  maxInnerWheelAngle: {
    min: 45,
    max: 120,
    step: 5,
    label: "Max Inner Wheel Angle (degrees)",
    unit: "°",
  },
  steeringRatio: {
    min: 8,
    max: 25,
    step: 1,
    label: "Steering Ratio",
    unit: ":1",
  },
  ackermannRatio: {
    min: 0.0,
    max: 1.0,
    step: 0.1,
    label: "Ackermann Factor",
    unit: "",
  },
  casterStiffness: {
    min: 0.0,
    max: 2.0,
    step: 0.1,
    label: "Caster Stiffness",
    unit: "",
  },
  steerRate: {
    min: 0.5,
    max: 5.0,
    step: 0.1,
    label: "Steering Rate (rad/s)",
    unit: "rad/s",
  },
  cameraScale: {
    min: 0.3,
    max: 2.0,
    step: 0.1,
    label: "Camera Zoom Scale",
    unit: "",
  },
  flipControls: {
    min: 0,
    max: 1,
    step: 1,
    label: "Flip Controls",
    unit: "",
  },
};

// Recording data type
type RecordingFrame = {
  timestamp: number;
  x: number;
  y: number;
  theta: number;
  vx: number;
  vy: number;
  r: number;
  steeringAngle: number;
  leftWheelAngle: number;
  rightWheelAngle: number;
};

type RecordingMode = "idle" | "recording" | "playing";

const VTrackPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("idle");
  const [recording, setRecording] = useState<RecordingFrame[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage or use defaults
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vtrack-settings");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn("Failed to parse saved settings:", e);
        }
      }
    }

    return {
      mass: DEFAULT_CONFIG.car.mass,
      inertiaZ: DEFAULT_CONFIG.car.inertiaZ,
      wheelbase: DEFAULT_CONFIG.car.wheelbase,
      trackWidth: DEFAULT_CONFIG.car.trackWidth,
      corneringStiffnessFront: DEFAULT_CONFIG.car.corneringStiffnessFront,
      corneringStiffnessRear: DEFAULT_CONFIG.car.corneringStiffnessRear,
      mu: DEFAULT_CONFIG.car.mu,
      maxEngineTorque: DEFAULT_CONFIG.car.maxEngineTorque,
      wheelRadius: DEFAULT_CONFIG.car.wheelRadius,
      maxSteeringAngle: (DEFAULT_CONFIG.car.maxSteeringAngle * 180) / Math.PI,
      maxInnerWheelAngle:
        (DEFAULT_CONFIG.car.maxInnerWheelAngle * 180) / Math.PI,
      steeringRatio: DEFAULT_CONFIG.car.steeringRatio,
      ackermannRatio: DEFAULT_CONFIG.car.ackermannRatio,
      casterStiffness: DEFAULT_CONFIG.car.casterStiffness,
      steerRate: DEFAULT_CONFIG.car.steerRate,
      cameraScale: DEFAULT_CONFIG.camera.scale,
      flipControls: 0, // Default to normal controls
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vtrack-settings", JSON.stringify(settings));
    }
  }, [settings]);

  const handleSettingChange = (key: keyof Settings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    const defaultSettings: Settings = {
      mass: DEFAULT_CONFIG.car.mass,
      inertiaZ: DEFAULT_CONFIG.car.inertiaZ,
      wheelbase: DEFAULT_CONFIG.car.wheelbase,
      trackWidth: DEFAULT_CONFIG.car.trackWidth,
      corneringStiffnessFront: DEFAULT_CONFIG.car.corneringStiffnessFront,
      corneringStiffnessRear: DEFAULT_CONFIG.car.corneringStiffnessRear,
      mu: DEFAULT_CONFIG.car.mu,
      maxEngineTorque: DEFAULT_CONFIG.car.maxEngineTorque,
      wheelRadius: DEFAULT_CONFIG.car.wheelRadius,
      maxSteeringAngle: (DEFAULT_CONFIG.car.maxSteeringAngle * 180) / Math.PI,
      maxInnerWheelAngle:
        (DEFAULT_CONFIG.car.maxInnerWheelAngle * 180) / Math.PI,
      steeringRatio: DEFAULT_CONFIG.car.steeringRatio,
      ackermannRatio: DEFAULT_CONFIG.car.ackermannRatio,
      casterStiffness: DEFAULT_CONFIG.car.casterStiffness,
      steerRate: DEFAULT_CONFIG.car.steerRate,
      cameraScale: DEFAULT_CONFIG.camera.scale,
      flipControls: 0, // Reset flip controls to normal
    };
    setSettings(defaultSettings);
  };

  // Recording and playback handlers
  const startRecording = () => {
    setRecording([]);
    setRecordingMode("recording");
  };

  const stopRecording = () => {
    // Auto-play the recording immediately if there's content
    if (recording.length > 0) {
      setPlaybackIndex(0);
      setRecordingMode("playing");
    } else {
      setRecordingMode("idle");
    }
  };

  // Store game instance reference
  const gameRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create CONFIG with current settings
    const CONFIG = {
      ...DEFAULT_CONFIG,
      car: {
        ...DEFAULT_CONFIG.car,
        mass: settings.mass,
        inertiaZ: settings.inertiaZ,
        wheelbase: settings.wheelbase,
        trackWidth: settings.trackWidth,
        corneringStiffnessFront: settings.corneringStiffnessFront,
        corneringStiffnessRear: settings.corneringStiffnessRear,
        mu: settings.mu,
        maxEngineTorque: settings.maxEngineTorque,
        wheelRadius: settings.wheelRadius,
        maxSteeringAngle: (settings.maxSteeringAngle * Math.PI) / 180,
        maxInnerWheelAngle: (settings.maxInnerWheelAngle * Math.PI) / 180,
        steeringRatio: settings.steeringRatio,
        ackermannRatio: settings.ackermannRatio,
        casterStiffness: settings.casterStiffness,
        steerRate: settings.steerRate,
      },
      camera: {
        ...DEFAULT_CONFIG.camera,
        scale: settings.cameraScale,
      },
    };

    // Utility functions to get effective background dimensions
    function getEffectiveBackgroundWidth() {
      return CONFIG.background.width * CONFIG.background.scale;
    }

    function getEffectiveBackgroundHeight() {
      return CONFIG.background.height * CONFIG.background.scale;
    }

    // Utility functions to get effective boundary dimensions (scaled with background)
    function getEffectiveBoundary() {
      return {
        x: CONFIG.boundary.x * CONFIG.background.scale,
        y: CONFIG.boundary.y * CONFIG.background.scale,
        width: CONFIG.boundary.width * CONFIG.background.scale,
        height: CONFIG.boundary.height * CONFIG.background.scale,
      };
    }

    // Utility functions
    function clamp(value: number, min: number, max: number) {
      return Math.min(Math.max(value, min), max);
    }

    class InputHandler {
      keys: Record<string, boolean> = {};
      buttons = {
        throttle: false,
        brake: false,
        steerLeft: false,
        steerRight: false,
      };

      constructor() {
        // Keyboard event listeners
        const handleKeyDown = (e: KeyboardEvent) => {
          e.preventDefault();
          this.keys[e.code] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
          e.preventDefault();
          this.keys[e.code] = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        // Button touch event listeners
        this.setupButtonEvents();

        // Store cleanup functions
        (this as any).cleanup = () => {
          window.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("keyup", handleKeyUp);
        };
      }

      setupButtonEvents() {
        // Get button elements
        const goButton = document.getElementById("car-go");
        const stopButton = document.getElementById("car-stop");
        const leftButton = document.getElementById("car-left");
        const rightButton = document.getElementById("car-right");

        // Helper function to add touch and mouse events
        const addButtonEvents = (
          button: HTMLElement | null,
          buttonKey: keyof typeof this.buttons,
        ) => {
          if (!button) return;

          const startEvents = ["touchstart", "mousedown"];
          const endEvents = [
            "touchend",
            "touchcancel",
            "mouseup",
            "mouseleave",
          ];

          startEvents.forEach((event) => {
            button.addEventListener(event, (e) => {
              e.preventDefault(); // Prevent default touch behavior
              this.buttons[buttonKey] = true;
            });
          });

          endEvents.forEach((event) => {
            button.addEventListener(event, (e) => {
              e.preventDefault(); // Prevent default touch behavior
              this.buttons[buttonKey] = false;
            });
          });

          // Prevent context menu on long press
          button.addEventListener("contextmenu", (e) => {
            e.preventDefault();
          });
        };

        // Hook up each button
        addButtonEvents(goButton, "throttle");
        addButtonEvents(stopButton, "brake");
        addButtonEvents(leftButton, "steerLeft");
        addButtonEvents(rightButton, "steerRight");
      }

      getControls() {
        return {
          throttle:
            this.keys[CONFIG.input.throttleKey] || this.buttons.throttle
              ? 1
              : 0,
          brake: this.keys[CONFIG.input.brakeKey] || this.buttons.brake ? 1 : 0,
          steerLeft:
            this.keys[CONFIG.input.steerLeftKey] || this.buttons.steerLeft
              ? 1
              : 0,
          steerRight:
            this.keys[CONFIG.input.steerRightKey] || this.buttons.steerRight
              ? 1
              : 0,
        };
      }
    }

    class Car {
      carImage: HTMLImageElement;
      x: number;
      y: number;
      theta: number;
      vx: number;
      vy: number;
      r: number;
      steeringInput: number;
      steeringAngle: number;
      leftWheelAngle: number;
      rightWheelAngle: number;
      tractionForce: number;
      brakeForce: number;
      wheelSpeed: number;
      Fx_f: number;
      Fy_f: number;
      Fx_r: number;
      Fy_r: number;
      alpha_f: number;
      alpha_r: number;
      slipRatio: number;
      Fz_f: number;
      Fz_r: number;
      trailMarks: Array<{
        x: number;
        y: number;
        time: number;
        intensity: number;
      }>;
      lastSkidTime: number;

      constructor() {
        // Load car image
        this.carImage = new Image();
        this.carImage.src = "car-2.png";

        // === RIGID BODY STATE VARIABLES ===
        // Position and orientation in global coordinates
        this.x = getEffectiveBackgroundWidth() / 2; // Global X position (pixels)
        this.y = getEffectiveBackgroundHeight() / 2; // Global Y position (pixels)
        this.theta = 0; // Heading angle (rad) - 0 points up (North)

        // Velocity in body-fixed coordinate system
        this.vx = 0; // Longitudinal velocity (m/s) - forward/backward
        this.vy = 0; // Lateral velocity (m/s) - left/right
        this.r = 0; // Yaw rate (rad/s) - angular velocity

        // Steering system
        this.steeringInput = 0; // Raw steering input (-1 to 1)
        this.steeringAngle = 0; // Front steering angle (rad)
        this.leftWheelAngle = 0; // Left wheel steering angle (rad)
        this.rightWheelAngle = 0; // Right wheel steering angle (rad)

        // Drivetrain state
        this.tractionForce = 0; // Current traction force (N)
        this.brakeForce = 0; // Current brake force (N)
        this.wheelSpeed = 0; // Rear wheel speed (rad/s)

        // Tire forces in body frame (N)
        this.Fx_f = 0; // Front longitudinal force
        this.Fy_f = 0; // Front lateral force
        this.Fx_r = 0; // Rear longitudinal force
        this.Fy_r = 0; // Rear lateral force

        // Slip angles and ratios
        this.alpha_f = 0; // Front slip angle (rad)
        this.alpha_r = 0; // Rear slip angle (rad)
        this.slipRatio = 0; // Rear wheel slip ratio

        // Normal forces (simplified - no load transfer) - with updated weight distribution
        this.Fz_f =
          (CONFIG.car.mass * 9.81 * CONFIG.car.b) / CONFIG.car.wheelbase;
        this.Fz_r =
          (CONFIG.car.mass * 9.81 * CONFIG.car.a) / CONFIG.car.wheelbase;

        // Trail marks for visual effects
        this.trailMarks = [];
        this.lastSkidTime = 0;
      }

      update(dt: number, controls: ReturnType<InputHandler["getControls"]>) {
        const config = CONFIG.car;

        // Use fixed physics timestep with frame rate independence
        const physicsTimeStep = config.timeStep;
        const maxSteps = 4; // Limit substeps to prevent spiral of death
        const numSteps = Math.min(Math.ceil(dt / physicsTimeStep), maxSteps);
        const actualTimeStep = dt / numSteps;

        // Run physics substeps for frame rate independence
        for (let i = 0; i < numSteps; i++) {
          this.updatePhysicsStep(actualTimeStep, controls);
        }

        // Update visual effects
        this.updateVisualEffects();

        // Clean up old trail marks (older than 4 seconds)
        const now = Date.now();
        this.trailMarks = this.trailMarks.filter(
          (mark) => now - mark.time < 4000,
        );
      }

      updatePhysicsStep(
        dt: number,
        controls: ReturnType<InputHandler["getControls"]>,
      ) {
        // === 1. STEERING INPUT PROCESSING ===
        this.processSteeringInput(controls, dt);

        // === 2. DRIVETRAIN FORCES ===
        this.updateDrivetrain(controls, dt);

        // === 3. CALCULATE SLIP ANGLES ===
        this.calculateSlipAngles();

        // === 4. TIRE FORCE GENERATION ===
        this.calculateTireForces();

        // === 5. VEHICLE EQUATIONS OF MOTION ===
        this.updateMotion(dt);

        // === 6. UPDATE GLOBAL POSITION ===
        this.updateGlobalPosition(dt);
      }

      processSteeringInput(
        controls: ReturnType<InputHandler["getControls"]>,
        dt: number,
      ) {
        const config = CONFIG.car;

        // Raw steering input
        let steerInput = 0;
        if (controls.steerLeft) steerInput -= 1;
        if (controls.steerRight) steerInput += 1;

        this.steeringInput = steerInput;

        // Target steering angle
        const targetSteeringAngle = steerInput * config.maxSteeringAngle;

        // Apply steering rate limiting for realism - controlled response
        const deltaError = targetSteeringAngle - this.steeringAngle;
        this.steeringAngle +=
          Math.sign(deltaError) *
          Math.min(Math.abs(deltaError), config.steerRate * dt);

        // Clamp to maximum steering angle
        this.steeringAngle = clamp(
          this.steeringAngle,
          -config.maxSteeringAngle,
          config.maxSteeringAngle,
        );

        // ✅ 6. Instant caster - snaps to velocity direction when no user input
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (Math.abs(steerInput) < 0.1 && speed > 2.0) {
          // Only when user lets off steering and moving fast
          // Calculate angle between car heading and velocity (vehicle slip angle)
          const velocityAngle = Math.atan2(this.vy, this.vx);
          // INSTANT caster - directly align wheels with velocity direction
          const casterTarget = velocityAngle * config.casterStiffness;
          this.steeringAngle = clamp(
            casterTarget,
            -config.maxSteeringAngle,
            config.maxSteeringAngle,
          );
        }

        // Calculate Ackermann steering angles
        this.calculateAckermannSteering();
      }

      calculateAckermannSteering() {
        const config = CONFIG.car;

        if (Math.abs(this.steeringAngle) < 0.001) {
          this.leftWheelAngle = 0;
          this.rightWheelAngle = 0;
          return;
        }

        // Calculate turn radius using bicycle model
        const turnRadius =
          config.wheelbase / Math.tan(Math.abs(this.steeringAngle));

        // Inner and outer wheel radii
        const innerRadius = turnRadius - config.trackWidth / 2;
        const outerRadius = turnRadius + config.trackWidth / 2;

        // Calculate ideal Ackermann angles
        let delta_inner = Math.atan(
          config.wheelbase / Math.max(innerRadius, 0.1),
        );
        let delta_outer = Math.atan(config.wheelbase / outerRadius);

        // Apply steering direction
        if (this.steeringAngle < 0) {
          delta_inner = -delta_inner;
          delta_outer = -delta_outer;
        }

        // Determine which wheel is inner/outer and apply Ackermann ratio
        if (this.steeringAngle > 0) {
          // Right turn - right wheel is inner
          let innerWheelAngle =
            this.steeringAngle *
            (1 +
              config.ackermannRatio * (delta_inner / this.steeringAngle - 1));
          let outerWheelAngle =
            this.steeringAngle *
            (1 +
              config.ackermannRatio * (delta_outer / this.steeringAngle - 1));

          this.rightWheelAngle = innerWheelAngle;
          this.leftWheelAngle = outerWheelAngle;
        } else {
          // Left turn - left wheel is inner
          let innerWheelAngle =
            this.steeringAngle *
            (1 +
              config.ackermannRatio * (delta_inner / this.steeringAngle - 1));
          let outerWheelAngle =
            this.steeringAngle *
            (1 +
              config.ackermannRatio * (delta_outer / this.steeringAngle - 1));

          this.leftWheelAngle = innerWheelAngle;
          this.rightWheelAngle = outerWheelAngle;
        }

        // Clamp wheel angles - inner wheel can reach full 90 degrees
        this.leftWheelAngle = clamp(
          this.leftWheelAngle,
          -config.maxInnerWheelAngle,
          config.maxInnerWheelAngle,
        );
        this.rightWheelAngle = clamp(
          this.rightWheelAngle,
          -config.maxInnerWheelAngle,
          config.maxInnerWheelAngle,
        );
      }

      updateDrivetrain(
        controls: ReturnType<InputHandler["getControls"]>,
        dt: number,
      ) {
        const config = CONFIG.car;

        // Engine torque from throttle
        let engineTorque = 0;
        if (controls.throttle) {
          engineTorque = config.maxEngineTorque;
        }

        // Brake torque - only for slowing down, no reverse
        let brakeTorque = 0;
        if (controls.brake) {
          brakeTorque = 2000; // Nm
        }

        // Calculate traction and brake forces
        this.tractionForce = engineTorque / config.wheelRadius;
        this.brakeForce = brakeTorque / config.wheelRadius;

        // Update wheel speed (simplified)
        const wheelInertia = 2.0; // kg⋅m²
        const netTorque = engineTorque - brakeTorque;
        this.wheelSpeed += (netTorque / wheelInertia) * dt;
        this.wheelSpeed = Math.max(0, this.wheelSpeed); // Prevent negative rotation
      }

      calculateSlipAngles() {
        const config = CONFIG.car;

        // ✅ 2. Slip angle calculation (exact from specification)
        // alpha_f = atan2(vy_body + a * r, vx_body) - steeringAngle;
        // alpha_r = atan2(vy_body - b * r, vx_body);

        // Velocity at front axle in body frame
        const vx_body = this.vx;
        const vy_f = this.vy + config.a * this.r; // vy_body + a * r
        const vy_r = this.vy - config.b * this.r; // vy_body - b * r

        // Front slip angle: α_f = atan2(vy_body + a * r, vx_body) - steeringAngle
        this.alpha_f = Math.atan2(vy_f, vx_body) - this.steeringAngle;

        // Rear slip angle: α_r = atan2(vy_body - b * r, vx_body)
        this.alpha_r = Math.atan2(vy_r, vx_body);

        // Slip ratio for rear wheels (for longitudinal force)
        const wheelLinearSpeed = this.wheelSpeed * config.wheelRadius;
        const vehicleSpeed = Math.abs(this.vx);
        const epsilon = 0.1;
        if (vehicleSpeed > epsilon) {
          this.slipRatio = (wheelLinearSpeed - vehicleSpeed) / vehicleSpeed;
        } else {
          this.slipRatio = 0;
        }
      }

      calculateTireForces() {
        const config = CONFIG.car;

        // ✅ 2. Use lateral stiffness model (exact from specification)
        // Fy_f = -corneringStiffnessFront * alpha_f;
        // Fy_r = -corneringStiffnessRear * alpha_r;
        this.Fy_f = -config.corneringStiffnessFront * this.alpha_f;
        this.Fy_r = -config.corneringStiffnessRear * this.alpha_r;

        // === LONGITUDINAL FORCES ===
        // Front longitudinal force (braking only)
        // this.Fx_f = -this.brakeForce * 0.6; // 60% brake bias to front

        // Rear longitudinal force - normal traction/braking only
        this.Fx_r = this.tractionForce - this.brakeForce * 1; // 100% brake bias to rear

        // ✅ 2. Limit force magnitude using friction circle (from specification)
        // Fy = clamp(Fy, -mu * Fz, mu * Fz)
        const maxLateralForce_f = config.mu * this.Fz_f;
        const maxLateralForce_r = config.mu * this.Fz_r;

        // Clamp lateral forces directly (allows oversteer to emerge naturally)
        this.Fy_f = clamp(this.Fy_f, -maxLateralForce_f, maxLateralForce_f);

        // ✅ 7. Allow rear forces to saturate for natural oversteer
        // if (abs(Fy_r) > mu * Fz_r) { Fy_r = sign(Fy_r) * mu * Fz_r; }
        if (Math.abs(this.Fy_r) > maxLateralForce_r) {
          this.Fy_r = Math.sign(this.Fy_r) * maxLateralForce_r;
        }

        // Combined friction circle - longitudinal force reduces available lateral grip
        const maxLongForce_f = config.mu * this.Fz_f;
        const maxLongForce_r = config.mu * this.Fz_r;

        // Limit longitudinal forces
        this.Fx_f = clamp(this.Fx_f, -maxLongForce_f, maxLongForce_f);
        this.Fx_r = clamp(this.Fx_r, -maxLongForce_r, maxLongForce_r);

        // Reduce available lateral grip when using longitudinal force (friction circle)
        const frontLongRatio = Math.abs(this.Fx_f) / maxLongForce_f;
        const rearLongRatio = Math.abs(this.Fx_r) / maxLongForce_r;

        const availableFrontLateral =
          maxLateralForce_f *
          Math.sqrt(Math.max(0, 1 - frontLongRatio * frontLongRatio));
        const availableRearLateral =
          maxLateralForce_r *
          Math.sqrt(Math.max(0, 1 - rearLongRatio * rearLongRatio));

        // Re-clamp lateral forces with reduced limits
        this.Fy_f = clamp(
          this.Fy_f,
          -availableFrontLateral,
          availableFrontLateral,
        );
        this.Fy_r = clamp(
          this.Fy_r,
          -availableRearLateral,
          availableRearLateral,
        );
      }

      updateMotion(dt: number) {
        const config = CONFIG.car;

        // === VEHICLE EQUATIONS OF MOTION ===
        // Lateral and longitudinal accelerations in body frame
        const ax =
          (this.Fx_f * Math.cos(this.steeringAngle) -
            this.Fy_f * Math.sin(this.steeringAngle) +
            this.Fx_r) /
            config.mass +
          this.vy * this.r;
        const ay =
          (this.Fy_f * Math.cos(this.steeringAngle) +
            this.Fx_f * Math.sin(this.steeringAngle) +
            this.Fy_r) /
            config.mass -
          this.vx * this.r;

        // Yaw acceleration
        let yawAccel =
          (config.a *
            (this.Fy_f * Math.cos(this.steeringAngle) +
              this.Fx_f * Math.sin(this.steeringAngle)) -
            config.b * this.Fy_r) /
          config.inertiaZ;

        // Balanced speed-dependent aerodynamic stability
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 0.5) {
          // Kicks in very early but scales more moderately with speed
          const vehicleSlipAngle = Math.atan2(this.vy, this.vx); // Angle between heading and velocity
          const speedFactor = Math.pow(speed / 10.0, 2.5); // Less aggressive scaling
          const stabilityTorque = -vehicleSlipAngle * speed * speedFactor * 1.2; // Moderate high-speed stability
          yawAccel += stabilityTorque / config.inertiaZ;
        }

        // Integrate velocities
        this.vx += ax * dt;
        this.vy += ay * dt;
        this.r += yawAccel * dt;

        // Prevent reverse motion - clamp longitudinal velocity to be non-negative
        this.vx = Math.max(0, this.vx);

        // Apply light damping for stability
        this.vy *= 0.999;
        this.r *= 1.0; // NO yaw damping for maximum rotation speed
      }

      updateGlobalPosition(dt: number) {
        // Convert body-frame velocities to global frame
        // Simple and consistent: theta=0 points up, positive theta = clockwise
        const vx_global =
          this.vx * Math.sin(this.theta) + this.vy * Math.cos(this.theta);
        const vy_global =
          this.vx * -Math.cos(this.theta) + this.vy * Math.sin(this.theta);

        // Scale from m/s to pixels/s (50 pixels per meter)
        const pixelScale = 50;

        // Update global state
        this.x += vx_global * dt * pixelScale;
        this.y += vy_global * dt * pixelScale;
        this.theta += this.r * dt;

        // Normalize heading angle
        while (this.theta > Math.PI) this.theta -= 2 * Math.PI;
        while (this.theta < -Math.PI) this.theta += 2 * Math.PI;

        // Boundary collision handling - keep car within boundary box
        const boundary = getEffectiveBoundary();
        const carRadius = 50; // Approximate car radius for collision

        // Left boundary
        if (this.x - carRadius < boundary.x) {
          this.x = boundary.x + carRadius;
          this.vx = Math.max(0, this.vx); // Stop leftward velocity
        }

        // Right boundary
        if (this.x + carRadius > boundary.x + boundary.width) {
          this.x = boundary.x + boundary.width - carRadius;
          this.vx = Math.min(0, this.vx); // Stop rightward velocity
        }

        // Top boundary
        if (this.y - carRadius < boundary.y) {
          this.y = boundary.y + carRadius;
          this.vy = Math.max(0, this.vy); // Stop upward velocity
        }

        // Bottom boundary
        if (this.y + carRadius > boundary.y + boundary.height) {
          this.y = boundary.y + boundary.height - carRadius;
          this.vy = Math.min(0, this.vy); // Stop downward velocity
        }
      }

      updateVisualEffects() {
        const config = CONFIG.car;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const rearSlipAngleDeg = (Math.abs(this.alpha_r) * 180) / Math.PI;

        // Create skidmarks when rear wheels are slipping (losing grip)
        // Based on rear slip angle and having some forward motion
        if (speed > 1.0 && rearSlipAngleDeg > 3) {
          this.createSkidmark();
        }
      }

      createSkidmark() {
        const now = Date.now();
        if (now - this.lastSkidTime > 20) {
          // Create skidmarks frequently while slipping
          const config = CONFIG.car;

          // Use EXACT same positioning logic as tire rendering
          const carWidth = config.dimensions.width * 50;
          const carLength = config.dimensions.length * 50;

          // Same offsets as tire rendering
          const rearOffset = -carLength * 0.3; // Rear tires position
          const rearLeftOffset = -carWidth * 0.44; // Rear left offset - matches render method
          const rearRightOffset = carWidth * 0.44; // Rear right offset - matches render method

          // Calculate CURRENT rear wheel positions (where tires are RIGHT NOW)
          const rearLeftX =
            this.x +
            (rearOffset * Math.sin(this.theta) +
              rearLeftOffset * Math.cos(this.theta));
          const rearLeftY =
            this.y +
            (rearOffset * -Math.cos(this.theta) +
              rearLeftOffset * Math.sin(this.theta));

          const rearRightX =
            this.x +
            (rearOffset * Math.sin(this.theta) +
              rearRightOffset * Math.cos(this.theta));
          const rearRightY =
            this.y +
            (rearOffset * -Math.cos(this.theta) +
              rearRightOffset * Math.sin(this.theta));

          // Intensity based on rear slip angle
          const intensity = Math.min(Math.abs(this.alpha_r) / 0.3, 1.0);

          this.trailMarks.push({
            x: rearLeftX,
            y: rearLeftY,
            time: now,
            intensity: intensity,
          });

          this.trailMarks.push({
            x: rearRightX,
            y: rearRightY,
            time: now,
            intensity: intensity,
          });

          this.lastSkidTime = now;
        }
      }

      // Save current car state for recording
      saveState(timestamp: number): RecordingFrame {
        return {
          timestamp,
          x: this.x,
          y: this.y,
          theta: this.theta,
          vx: this.vx,
          vy: this.vy,
          r: this.r,
          steeringAngle: this.steeringAngle,
          leftWheelAngle: this.leftWheelAngle,
          rightWheelAngle: this.rightWheelAngle,
        };
      }

      // Restore car state from recording frame
      restoreState(frame: RecordingFrame) {
        this.x = frame.x;
        this.y = frame.y;
        this.theta = frame.theta;
        this.vx = frame.vx;
        this.vy = frame.vy;
        this.r = frame.r;
        this.steeringAngle = frame.steeringAngle;
        this.leftWheelAngle = frame.leftWheelAngle;
        this.rightWheelAngle = frame.rightWheelAngle;
        // Don't restore trail marks - let them accumulate during playback
      }

      // Reset car to starting position
      resetToStart() {
        this.x = getEffectiveBackgroundWidth() / 2;
        this.y = getEffectiveBackgroundHeight() / 2;
        this.theta = 0;
        this.vx = 0;
        this.vy = 0;
        this.r = 0;
        this.steeringInput = 0;
        this.steeringAngle = 0;
        this.leftWheelAngle = 0;
        this.rightWheelAngle = 0;
        this.tractionForce = 0;
        this.brakeForce = 0;
        this.wheelSpeed = 0;
        this.trailMarks = []; // Clear skid marks
      }

      render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        // Car dimensions (scaled down 50% from original)
        const carWidth = CONFIG.car.dimensions.width * 50; // 90px
        const carLength = CONFIG.car.dimensions.length * 50; // 210px

        // Draw trail marks first (bottom layer)
        this.trailMarks.forEach((mark) => {
          const markX = mark.x - cameraX;
          const markY = mark.y - cameraY;
          const age = (Date.now() - mark.time) / 4000;
          const alpha = (1 - age) * mark.intensity * CONFIG.car.skidmarkAlpha;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#1a1a1a";
          ctx.beginPath();
          ctx.arc(markX, markY, 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        });

        // TIRE POSITIONING - Keep wheels attached to car
        // All tire positions are calculated relative to car center, then transformed to world coordinates

        // Tire dimensions
        const tireWidth = 8;
        const tireLength = 16;

        // Tire offsets in car's local coordinate system (car faces up when theta=0)
        const frontOffset = carLength * 0.3; // Front tires position
        const rearOffset = -carLength * 0.3; // Rear tires position

        // Different track widths for front and rear
        const frontLeftOffset = -carWidth * 0.466; // Front left offset
        const frontRightOffset = carWidth * 0.466; // Front right offset
        const rearLeftOffset = -carWidth * 0.44; // Rear left offset - slightly narrower
        const rearRightOffset = carWidth * 0.44; // Rear right offset - slightly narrower

        // Calculate tire positions in world coordinates
        // Calculate tire positions using same coordinate system as movement
        // Front tires
        const frontLeftX =
          screenX +
          (frontOffset * Math.sin(this.theta) +
            frontLeftOffset * Math.cos(this.theta));
        const frontLeftY =
          screenY +
          (frontOffset * -Math.cos(this.theta) +
            frontLeftOffset * Math.sin(this.theta));

        const frontRightX =
          screenX +
          (frontOffset * Math.sin(this.theta) +
            frontRightOffset * Math.cos(this.theta));
        const frontRightY =
          screenY +
          (frontOffset * -Math.cos(this.theta) +
            frontRightOffset * Math.sin(this.theta));

        // Rear tires (fixed, no steering)
        const rearLeftX =
          screenX +
          (rearOffset * Math.sin(this.theta) +
            rearLeftOffset * Math.cos(this.theta));
        const rearLeftY =
          screenY +
          (rearOffset * -Math.cos(this.theta) +
            rearLeftOffset * Math.sin(this.theta));

        const rearRightX =
          screenX +
          (rearOffset * Math.sin(this.theta) +
            rearRightOffset * Math.cos(this.theta));
        const rearRightY =
          screenY +
          (rearOffset * -Math.cos(this.theta) +
            rearRightOffset * Math.sin(this.theta));

        // Draw tires second (middle layer)
        // Draw front left tire (steered)
        ctx.save();
        ctx.translate(frontLeftX, frontLeftY);
        ctx.rotate(this.theta + this.leftWheelAngle);
        ctx.fillStyle = "#222";
        ctx.fillRect(-tireWidth / 2, -tireLength / 2, tireWidth, tireLength);
        ctx.restore();

        // Draw front right tire (steered)
        ctx.save();
        ctx.translate(frontRightX, frontRightY);
        ctx.rotate(this.theta + this.rightWheelAngle);
        ctx.fillStyle = "#222";
        ctx.fillRect(-tireWidth / 2, -tireLength / 2, tireWidth, tireLength);
        ctx.restore();

        // Draw rear left tire (not steered)
        ctx.save();
        ctx.translate(rearLeftX, rearLeftY);
        ctx.rotate(this.theta);
        ctx.fillStyle = "#333";
        ctx.fillRect(-tireWidth / 2, -tireLength / 2, tireWidth, tireLength);
        ctx.restore();

        // Draw rear right tire (not steered)
        ctx.save();
        ctx.translate(rearRightX, rearRightY);
        ctx.rotate(this.theta);
        ctx.fillStyle = "#333";
        ctx.fillRect(-tireWidth / 2, -tireLength / 2, tireWidth, tireLength);
        ctx.restore();

        // Draw car image last (top layer)
        if (this.carImage.complete) {
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(this.theta);
          ctx.drawImage(
            this.carImage,
            -carWidth / 2,
            -carLength / 2,
            carWidth,
            carLength,
          );
          ctx.restore();
        }
      }
    }

    class GhostCar extends Car {
      isVisible: boolean = false;

      constructor() {
        super();
        this.isVisible = false;
      }

      // Override render method to draw ghost car with transparency
      render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
        if (!this.isVisible) return;

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        // Car dimensions (scaled down 50% from original)
        const carWidth = CONFIG.car.dimensions.width * 50; // 90px
        const carLength = CONFIG.car.dimensions.length * 50; // 210px

        // Draw trail marks first (bottom layer) - more transparent
        this.trailMarks.forEach((mark) => {
          const markX = mark.x - cameraX;
          const markY = mark.y - cameraY;
          const age = (Date.now() - mark.time) / 4000;
          const alpha =
            (1 - age) * mark.intensity * CONFIG.car.skidmarkAlpha * 0.3; // More transparent

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#444"; // Lighter color for ghost trails
          ctx.beginPath();
          ctx.arc(markX, markY, 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        });

        // TIRE POSITIONING - Keep wheels attached to car
        // All tire positions are calculated relative to car center, then transformed to world coordinates

        // Tire dimensions
        const tireWidth = 8;
        const tireLength = 16;

        // Tire offsets in car's local coordinate system (car faces up when theta=0)
        const frontOffset = carLength * 0.3; // Front tires position
        const rearOffset = -carLength * 0.3; // Rear tires position

        // Different track widths for front and rear
        const frontLeftOffset = -carWidth * 0.466; // Front left offset
        const frontRightOffset = carWidth * 0.466; // Front right offset
        const rearLeftOffset = -carWidth * 0.44; // Rear left offset - slightly narrower
        const rearRightOffset = carWidth * 0.44; // Rear right offset - slightly narrower

        // Calculate tire positions in world coordinates
        // Calculate tire positions using same coordinate system as movement
        // Front tires
        const frontLeftX =
          screenX +
          (frontOffset * Math.sin(this.theta) +
            frontLeftOffset * Math.cos(this.theta));
        const frontLeftY =
          screenY +
          (frontOffset * -Math.cos(this.theta) +
            frontLeftOffset * Math.sin(this.theta));

        const frontRightX =
          screenX +
          (frontOffset * Math.sin(this.theta) +
            frontRightOffset * Math.cos(this.theta));
        const frontRightY =
          screenY +
          (frontOffset * -Math.cos(this.theta) +
            frontRightOffset * Math.sin(this.theta));

        // Rear tires (fixed, no steering)
        const rearLeftX =
          screenX +
          (rearOffset * Math.sin(this.theta) +
            rearLeftOffset * Math.cos(this.theta));
        const rearLeftY =
          screenY +
          (rearOffset * -Math.cos(this.theta) +
            rearLeftOffset * Math.sin(this.theta));

        const rearRightX =
          screenX +
          (rearOffset * Math.sin(this.theta) +
            rearRightOffset * Math.cos(this.theta));
        const rearRightY =
          screenY +
          (rearOffset * -Math.cos(this.theta) +
            rearRightOffset * Math.sin(this.theta));

        // Set global transparency for all ghost car elements
        ctx.save();
        ctx.globalAlpha = 0.5; // Make ghost car semi-transparent

        // Draw tires second (middle layer)
        // Draw front left tire (steered)
        ctx.save();
        ctx.translate(frontLeftX, frontLeftY);
        ctx.rotate(this.theta + this.leftWheelAngle);
        ctx.fillStyle = "#555"; // Lighter color for ghost tires
        ctx.fillRect(-tireWidth / 2, -tireLength / 2, tireWidth, tireLength);
        ctx.restore();

        // Draw front right tire (steered)
        ctx.save();
        ctx.translate(frontRightX, frontRightY);
        ctx.rotate(this.theta + this.rightWheelAngle);
        ctx.fillStyle = "#555";
        ctx.fillRect(-tireWidth / 2, -tireLength / 2, tireWidth, tireLength);
        ctx.restore();

        // Draw rear left tire (not steered)
        ctx.save();
        ctx.translate(rearLeftX, rearLeftY);
        ctx.rotate(this.theta);
        ctx.fillStyle = "#666";
        ctx.fillRect(-tireWidth / 2, -tireLength / 2, tireWidth, tireLength);
        ctx.restore();

        // Draw rear right tire (not steered)
        ctx.save();
        ctx.translate(rearRightX, rearRightY);
        ctx.rotate(this.theta);
        ctx.fillStyle = "#666";
        ctx.fillRect(-tireWidth / 2, -tireLength / 2, tireWidth, tireLength);
        ctx.restore();

        // Draw car image last (top layer) with tint for ghost effect
        if (this.carImage.complete) {
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(this.theta);

          // Add a slight blue tint to distinguish ghost car
          ctx.filter = "sepia(100%) hue-rotate(200deg) saturate(50%)";

          ctx.drawImage(
            this.carImage,
            -carWidth / 2,
            -carLength / 2,
            carWidth,
            carLength,
          );
          ctx.restore();
        }

        ctx.restore(); // Restore original globalAlpha
      }

      show() {
        this.isVisible = true;
      }

      hide() {
        this.isVisible = false;
      }
    }

    class Game {
      $canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      backgroundImage: HTMLImageElement;
      inputHandler: InputHandler;
      car: Car;
      ghostCar: GhostCar;
      cameraX: number;
      cameraY: number;
      lastTime: number | null;
      animationId: number | null = null;

      // Recording/playback properties
      recordingMode: RecordingMode;
      recording: RecordingFrame[];
      playbackIndex: number;
      setRecording: (frames: RecordingFrame[]) => void;
      setPlaybackIndex: (index: number) => void;
      setRecordingMode: (mode: RecordingMode) => void;

      constructor(
        canvas: HTMLCanvasElement,
        recordingState: {
          recordingMode: RecordingMode;
          recording: RecordingFrame[];
          playbackIndex: number;
          setRecording: (frames: RecordingFrame[]) => void;
          setPlaybackIndex: (index: number) => void;
          setRecordingMode: (mode: RecordingMode) => void;
        },
      ) {
        this.$canvas = canvas;

        // Initialize recording state
        this.recordingMode = recordingState.recordingMode;
        this.recording = recordingState.recording;
        this.playbackIndex = recordingState.playbackIndex;
        this.setRecording = recordingState.setRecording;
        this.setPlaybackIndex = recordingState.setPlaybackIndex;
        this.setRecordingMode = recordingState.setRecordingMode;

        // Make canvas a perfect square based on the smaller dimension for mobile
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.$canvas.width = size;
        this.$canvas.height = size;

        this.ctx = this.$canvas.getContext("2d")!;

        // Load background image
        this.backgroundImage = new Image();
        this.backgroundImage.src = CONFIG.background.imageSrc;

        this.inputHandler = new InputHandler();
        this.car = new Car();
        this.ghostCar = new GhostCar();

        // Initialize camera to center on car
        this.cameraX = clamp(
          this.car.x - this.$canvas.width / 2,
          0,
          getEffectiveBackgroundWidth() - this.$canvas.width,
        );
        this.cameraY = clamp(
          this.car.y - this.$canvas.height / 2,
          0,
          getEffectiveBackgroundHeight() - this.$canvas.height,
        );

        this.lastTime = null; // Use null to detect first frame
        this.backgroundImage.onload = () => {
          this.gameLoop(performance.now()); // Use high-resolution timestamp
        };
      }

      gameLoop = (timestamp: number) => {
        // Initialize lastTime on first frame
        if (!this.lastTime) {
          this.lastTime = timestamp;
        }

        // Calculate actual delta time with better frame rate independence
        const dt = Math.min((timestamp - this.lastTime) / 1000, 1 / 20); // Cap at 20 FPS minimum
        this.lastTime = timestamp;

        // Skip frame if dt is too large (browser was paused/unfocused)
        if (dt > 1 / 20) {
          this.animationId = requestAnimationFrame(this.gameLoop);
          return;
        }

        // Always update the main car with user controls
        const controls = this.inputHandler.getControls();
        this.car.update(dt, controls);

        if (this.recordingMode === "recording") {
          // Record current frame while user drives
          const frame = this.car.saveState(timestamp);
          const newRecording = [...this.recording, frame];
          this.setRecording(newRecording);
          this.recording = newRecording; // Update local copy
        } else if (
          this.recordingMode === "playing" &&
          this.recording.length > 0
        ) {
          // Show ghost car during playback
          this.ghostCar.show();

          // Update ghost car position from recording
          const currentFrame = this.recording[this.playbackIndex];
          if (currentFrame) {
            this.ghostCar.restoreState(currentFrame);
          }

          // Advance playback index
          const nextIndex = this.playbackIndex + 1;
          if (nextIndex >= this.recording.length) {
            // Loop back to beginning
            this.setPlaybackIndex(0);
            this.playbackIndex = 0;
          } else {
            this.setPlaybackIndex(nextIndex);
            this.playbackIndex = nextIndex;
          }
        } else {
          // Hide ghost car when not playing
          this.ghostCar.hide();
        }

        this.updateCamera();
        this.draw();

        this.animationId = requestAnimationFrame(this.gameLoop);
      };

      updateCamera() {
        const bufferX = this.$canvas.width * CONFIG.camera.edgeBufferRatio;
        const bufferY = this.$canvas.height * CONFIG.camera.edgeBufferRatio;

        // Only move camera when car is near edge
        const carScreenX = this.car.x - this.cameraX;
        const carScreenY = this.car.y - this.cameraY;

        let targetCameraX = this.cameraX;
        let targetCameraY = this.cameraY;

        if (carScreenX < bufferX) {
          targetCameraX = this.car.x - bufferX;
        } else if (carScreenX > this.$canvas.width - bufferX) {
          targetCameraX = this.car.x - (this.$canvas.width - bufferX);
        }

        if (carScreenY < bufferY) {
          targetCameraY = this.car.y - bufferY;
        } else if (carScreenY > this.$canvas.height - bufferY) {
          targetCameraY = this.car.y - (this.$canvas.height - bufferY);
        }

        // Clamp camera to background bounds
        this.cameraX = clamp(
          targetCameraX,
          0,
          getEffectiveBackgroundWidth() - this.$canvas.width,
        );
        this.cameraY = clamp(
          targetCameraY,
          0,
          getEffectiveBackgroundHeight() - this.$canvas.height,
        );
      }

      draw() {
        this.ctx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);

        // Apply centered camera scale transformation
        this.ctx.save();

        // Translate to center of canvas
        this.ctx.translate(this.$canvas.width / 2, this.$canvas.height / 2);

        // Apply scale (higher number = zoom in, lower number = zoom out)
        this.ctx.scale(CONFIG.camera.scale, CONFIG.camera.scale);

        // Translate back from center
        this.ctx.translate(-this.$canvas.width / 2, -this.$canvas.height / 2);

        // Draw background (track image) with normal camera coordinates
        if (this.backgroundImage.complete) {
          this.ctx.drawImage(
            this.backgroundImage,
            -this.cameraX,
            -this.cameraY,
            getEffectiveBackgroundWidth(),
            getEffectiveBackgroundHeight(),
          );
        }

        // Render ghost car first (behind main car)
        this.ghostCar.render(this.ctx, this.cameraX, this.cameraY);

        // Render main car on top
        this.car.render(this.ctx, this.cameraX, this.cameraY);

        this.ctx.restore();
      }

      // Update recording state from React components
      updateRecordingState(newState: {
        recordingMode: RecordingMode;
        recording: RecordingFrame[];
        playbackIndex: number;
      }) {
        const oldMode = this.recordingMode;
        this.recordingMode = newState.recordingMode;
        this.recording = newState.recording;
        this.playbackIndex = newState.playbackIndex;

        // Handle ghost car when starting playback
        if (oldMode !== "playing" && newState.recordingMode === "playing") {
          if (newState.recording.length > 0) {
            this.ghostCar.restoreState(newState.recording[0]);
            this.ghostCar.trailMarks = []; // Clear ghost trail marks for clean playback
            this.ghostCar.show();
          }
        }

        // Hide ghost car when not playing
        if (newState.recordingMode !== "playing") {
          this.ghostCar.hide();
        }

        // Don't reset main car when starting recording - start from current position
      }

      cleanup() {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
        }
        if (this.inputHandler && (this.inputHandler as any).cleanup) {
          (this.inputHandler as any).cleanup();
        }
      }
    }

    // Initialize the game
    const game = new Game(canvasRef.current, {
      recordingMode,
      recording,
      playbackIndex,
      setRecording,
      setPlaybackIndex,
      setRecordingMode,
    });

    // Store game reference
    gameRef.current = game;

    // Cleanup function
    return () => {
      game.cleanup();
      gameRef.current = null;
    };
  }, [settings]); // Only recreate game when settings change

  // Sync recording state with game instance
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.updateRecordingState({
        recordingMode,
        recording,
        playbackIndex,
      });
    }
  }, [recordingMode, recording, playbackIndex]);

  return (
    <Flex
      h="calc(100dvh - 180px)"
      flexDir="column"
      bgColor="gray.800"
      w="1024px"
      maxW="100%"
      mx="auto"
      pos="relative"
      zIndex={1}
    >
      {/* Recording Status */}
      {recordingMode !== "idle" && (
        <Box
          pos="absolute"
          top="4"
          left="4"
          zIndex={200}
          px={3}
          py={1}
          bgColor={recordingMode === "recording" ? "red.600" : "green.600"}
          color="white"
          fontSize="sm"
          fontWeight="bold"
          rounded="md"
          display="flex"
          alignItems="center"
          gap={2}
        >
          {recordingMode === "recording" ? (
            <>
              <RiRecordCircleLine size={16} />
              RECORDING
            </>
          ) : (
            <>
              <RiPlayLine size={16} />
              REPLAYING
            </>
          )}
        </Box>
      )}

      {/* Control Buttons */}
      <Flex pos="absolute" top="4" right="4" zIndex={200} gap={2}>
        {/* Settings Button */}
        <Button onClick={() => setShowSettings(true)} px={2}>
          <RiSettings3Line size={20} />
        </Button>
      </Flex>

      {/* Settings Modal */}
      {showSettings && (
        <Box
          pos="fixed"
          top="0"
          pt="120px"
          pb={12}
          left="0"
          w="100vw"
          h="100vh"
          bgColor="rgba(0, 0, 0, 0.8)"
          zIndex={300}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettings(false);
            }
          }}
        >
          <Box pos="relative">
            <Button
              onClick={() => setShowSettings(false)}
              px={2}
              bgColor="transparent"
              pos="absolute"
              top={0}
              right={0}
              transform="translate(25%, -25%)"
            >
              <RiCloseLine size={20} />
            </Button>

            <Box
              w="90vw"
              maxW="600px"
              maxH="80vh"
              bgColor="gray.900"
              borderWidth={1}
              borderColor="gray.700"
              rounded="2xl"
              p={6}
              overflow="auto"
              onClick={(e) => e.stopPropagation()}
            >
              <styled.h2 fontSize="xl" fontWeight="bold" color="white" mb={4}>
                Settings
              </styled.h2>

              <Box display="grid" gap="4">
                {Object.entries(SETTINGS_CONFIG).map(([key, config]) => (
                  <Box key={key}>
                    <Flex justify="space-between" align="center" mb="2">
                      <styled.label fontSize="sm" color="gray.300">
                        {config.label}
                      </styled.label>
                      <styled.span fontSize="sm" color="gray.400">
                        {settings[key as keyof typeof settings]}
                        {config.unit}
                      </styled.span>
                    </Flex>
                    <styled.input
                      type="range"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={settings[key as keyof typeof settings]}
                      onChange={(e) =>
                        handleSettingChange(
                          key as keyof Settings,
                          parseFloat(e.target.value),
                        )
                      }
                      w="full"
                      h="2"
                      bgColor="gray.600"
                      rounded="lg"
                      appearance="none"
                      css={{
                        "&::-webkit-slider-thumb": {
                          appearance: "none",
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: "#3B82F6",
                          cursor: "pointer",
                        },
                        "&::-moz-range-thumb": {
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: "#3B82F6",
                          cursor: "pointer",
                          border: "none",
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <Button onClick={resetSettings} w="full" mt={6}>
                Reset to Defaults
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <Box
        overflow="hidden"
        rounded="4xl"
        m="4vw"
        borderWidth="1vw"
        borderColor="black"
      >
        <styled.canvas ref={canvasRef} w="100%" />
      </Box>
      <Center
        flexGrow={1}
        gap="4vw"
        px="4vw"
        pos="relative"
        flexDir={settings.flipControls ? "row-reverse" : "row"}
      >
        <Box
          pos="absolute"
          top="4vw"
          h="3vw"
          left="50%"
          w="11vw"
          rounded="full"
          transform="translate(-50%, -50%)"
          bgColor="green.500"
          zIndex={100}
          borderWidth={2}
          borderColor="black"
        />

        <Flex
          gap="6vw"
          p="2vw"
          bgColor="gray.900"
          rounded="full"
          borderWidth={2}
          borderColor="black"
          shadow="inset 0 4px 6px rgba(0, 0, 0, 0.8)"
        >
          <Button id="car-left" p={0} w="16vw" h="16vw" fontSize="3xl">
            <RiArrowDropLeftLine />
          </Button>
          <Button id="car-right" p={0} w="16vw" h="16vw" fontSize="3xl">
            <RiArrowDropRightLine />
          </Button>
        </Flex>

        <Spacer />

        <Flex
          gap="6vw"
          p="2vw"
          bgColor="gray.900"
          rounded="full"
          transform="rotate(-20deg)"
          borderWidth={1}
          borderColor="black"
          shadow="inset 0 4px 6px rgba(0, 0, 0, 0.8)"
          pos="relative"
        >
          <Box
            pos="absolute"
            top="0"
            left="50%"
            transform="translate(-50%, -50%)"
            rounded="full"
            p="2vw"
            bgColor="gray.900"
          >
            {/* Record Button */}
            {(recordingMode === "idle" || recordingMode === "playing") && (
              <Button onClick={startRecording} px={2} transform="rotate(20deg)">
                <RiRecordCircleLine size={20} />
              </Button>
            )}

            {/* Stop Recording Button */}
            {recordingMode === "recording" && (
              <Button onClick={stopRecording} px={2} transform="rotate(20deg)">
                <RiStopLine size={20} />
              </Button>
            )}
          </Box>

          <Button
            id="car-stop"
            p={0}
            w="16vw"
            h="16vw"
            fontSize="3xl"
            transform="rotate(20deg)"
          >
            <RiArrowDropDownLine />
          </Button>

          <Button
            id="car-go"
            p={0}
            w="16vw"
            h="16vw"
            fontSize="3xl"
            transform="rotate(20deg)"
          >
            <RiArrowDropUpLine />
          </Button>
        </Flex>
      </Center>
    </Flex>
  );
};

export default VTrackPage;

import { useEffect, useRef } from "react";
import {
  RiArrowDropDownLine,
  RiArrowDropLeftLine,
  RiArrowDropRightLine,
  RiArrowDropUpLine,
} from "react-icons/ri";
import { Button } from "~/components/Button";
import { Box, Center, Flex, Spacer, styled } from "~/styled-system/jsx";

const VTrackPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Default configuration values for realistic drift physics
    const DEFAULT_CONFIG = {
      background: {
        imageSrc: "track-2.png",
        width: 2048,
        height: 2048,
        scale: 1.05, // Scale factor for background size
      },

      // Boundary box to contain the car (in pixels, relative to scaled background)
      boundary: {
        x: 100, // Left edge
        y: 650, // Top edge
        width: 1950, // Width of boundary box
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
        maxSteeringAngle: 1.57, // radians (90 degrees) - increased steering angle
        maxInnerWheelAngle: Math.PI / 2, // 90 degrees maximum for inside wheel
        steeringRatio: 16, // steering wheel to road wheel ratio
        ackermannRatio: 0.3, // Ackermann factor (0-1) - reduced for less geometry correction
        casterStiffness: 0.9, // kcaster - stronger for better high-speed stability

        // Physics integration
        timeStep: 1 / 60, // 60 Hz physics update - more reasonable for frame drops

        // Visual effects
        skidmarkThreshold: 3, // slip angle threshold for skidmarks (degrees)
        skidmarkAlpha: 0.5,
      },

      camera: {
        edgeBufferRatio: 0.4,
      },

      input: {
        throttleKey: "ArrowUp",
        brakeKey: "ArrowDown",
        steerLeftKey: "ArrowLeft",
        steerRightKey: "ArrowRight",
      },
    };

    // Initialize CONFIG with default values
    const CONFIG = DEFAULT_CONFIG;

    // Utility functions to get effective background dimensions
    function getEffectiveBackgroundWidth() {
      return CONFIG.background.width * CONFIG.background.scale;
    }

    function getEffectiveBackgroundHeight() {
      return CONFIG.background.height * CONFIG.background.scale;
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
          this.keys[e.code] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
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
        const steerRate = 3.2; // rad/s - reduced for less sensitive steering
        const deltaError = targetSteeringAngle - this.steeringAngle;
        this.steeringAngle +=
          Math.sign(deltaError) *
          Math.min(Math.abs(deltaError), steerRate * dt);

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
        this.Fx_f = -this.brakeForce * 0.6; // 60% brake bias to front

        // Rear longitudinal force - normal traction/braking only
        this.Fx_r = this.tractionForce - this.brakeForce * 0.4; // 40% brake bias to rear

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
        const boundary = CONFIG.boundary;
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

    class Game {
      $canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      backgroundImage: HTMLImageElement;
      inputHandler: InputHandler;
      car: Car;
      cameraX: number;
      cameraY: number;
      lastTime: number | null;
      animationId: number | null = null;

      constructor(canvas: HTMLCanvasElement) {
        this.$canvas = canvas;

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

        const controls = this.inputHandler.getControls();
        this.car.update(dt, controls);
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

        // Draw background (track image) with scaling
        if (this.backgroundImage.complete) {
          this.ctx.drawImage(
            this.backgroundImage,
            -this.cameraX,
            -this.cameraY,
            getEffectiveBackgroundWidth(),
            getEffectiveBackgroundHeight(),
          );
        }

        // Render car
        this.car.render(this.ctx, this.cameraX, this.cameraY);
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
    const game = new Game(canvasRef.current);

    // Cleanup function
    return () => {
      game.cleanup();
    };
  }, []);

  return (
    <Flex h="calc(100dvh - 100px)" flexDir="column">
      <Box w="1024px" maxW="100%" mx="auto">
        <styled.canvas ref={canvasRef} w="100%" />
      </Box>
      <Center flex={1} gap={6} px="6vw">
        <Button id="car-left" p={0} w={16} h={16} fontSize="3xl">
          <RiArrowDropLeftLine />
        </Button>
        <Button id="car-right" p={0} w={16} h={16} fontSize="3xl">
          <RiArrowDropRightLine />
        </Button>

        <Spacer />

        <Button id="car-go" p={0} w={16} h={16} fontSize="3xl" mt={-6}>
          <RiArrowDropUpLine />
        </Button>
        <Button id="car-stop" p={0} w={16} h={16} fontSize="3xl" mt={6}>
          <RiArrowDropDownLine />
        </Button>
      </Center>
    </Flex>
  );
};

export default VTrackPage;

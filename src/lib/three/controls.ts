import * as THREE from 'three';
import {
  LOOK_SENSITIVITY, PITCH_LIMIT, MOVE_SPEED,
  CAM_XMIN, CAM_XMAX, CAM_ZMIN, CAM_ZMAX,
  CAM_FOV_MIN, CAM_FOV_MAX, SCROLL_ZOOM_SPEED,
} from './constants';
import { debugState } from './debug';

export class Controls {
  private yaw: number;
  private pitch = 0;
  private targetYaw:   number | null = null;
  private targetPitch: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private keys = new Set<string>();
  public isLocked = false;
  public frozen   = false;

  // Mobile tap callbacks
  public onTap?: (x: number, y: number) => void;
  public onDoubleTap?: (x: number, y: number) => void;

  // Touch tracking
  private lastTouchX = 0;
  private lastTouchY = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;
  private lastTapTime = 0;
  private pinchDist = 0;
  private _tapTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _yawEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _quat = new THREE.Quaternion();
  private readonly _dir = new THREE.Vector3();

  constructor(
    private camera: THREE.PerspectiveCamera,
    initialYaw = 0,
    private isMobile = false,
  ) {
    this.yaw = initialYaw;
    if (isMobile) this.isLocked = true;
  }

  animateYawTo(target: number) {
    this.targetYaw = target;
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    if (this.isMobile) {
      canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
      canvas.addEventListener('touchmove',  this.onTouchMove,  { passive: false });
      canvas.addEventListener('touchend',   this.onTouchEnd);
    } else {
      canvas.addEventListener('click', this.onClick);
      document.addEventListener('pointerlockchange', this.onLockChange);
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('keydown', this.onKeyDown);
      document.addEventListener('keyup', this.onKeyUp);
      canvas.addEventListener('wheel', this.onWheel, { passive: false });
    }
  }

  detach() {
    if (!this.canvas) return;
    if (this.isMobile) {
      this.canvas.removeEventListener('touchstart', this.onTouchStart);
      this.canvas.removeEventListener('touchmove',  this.onTouchMove);
      this.canvas.removeEventListener('touchend',   this.onTouchEnd);
    } else {
      this.canvas.removeEventListener('click', this.onClick);
      document.removeEventListener('pointerlockchange', this.onLockChange);
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('keyup', this.onKeyUp);
      this.canvas.removeEventListener('wheel', this.onWheel);
    }
    if (this._tapTimer !== null) { clearTimeout(this._tapTimer); this._tapTimer = null; }
    this.keys.clear();
    this.canvas = null;
  }

  private onClick = () => {
    if (!this.isLocked && this.canvas) {
      this.canvas.requestPointerLock();
    }
  };

  private onLockChange = () => {
    this.isLocked = document.pointerLockElement === this.canvas;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isLocked || this.frozen) return;
    this.targetYaw   = null;
    this.targetPitch = null;
    this.yaw   -= e.movementX * LOOK_SENSITIVITY;
    this.pitch -= e.movementY * LOOK_SENSITIVITY;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
  };

  private onKeyDown = (e: KeyboardEvent) => { this.keys.add(e.code); };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const fov = this.camera.fov + e.deltaY * SCROLL_ZOOM_SPEED;
    this.camera.fov = Math.max(CAM_FOV_MIN, Math.min(CAM_FOV_MAX, fov));
    this.camera.updateProjectionMatrix();
  };

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      this.lastTouchX     = t.clientX;
      this.lastTouchY     = t.clientY;
      this.touchStartX    = t.clientX;
      this.touchStartY    = t.clientY;
      this.touchStartTime = Date.now();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.pinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && !this.frozen) {
      const t  = e.touches[0];
      const dx = t.clientX - this.lastTouchX;
      const dy = t.clientY - this.lastTouchY;
      this.targetYaw   = null; // user took control — cancel programmatic pan
      this.targetPitch = null;
      this.yaw   += dx * LOOK_SENSITIVITY;
      this.pitch += dy * LOOK_SENSITIVITY;
      this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
      this.lastTouchX = t.clientX;
      this.lastTouchY = t.clientY;
    } else if (e.touches.length === 2) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = this.pinchDist - dist;
      this.camera.fov = Math.max(CAM_FOV_MIN, Math.min(CAM_FOV_MAX, this.camera.fov + delta * SCROLL_ZOOM_SPEED));
      this.camera.updateProjectionMatrix();
      this.pinchDist = dist;
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    // Sync lastTouchX/Y to remaining finger so next drag starts clean
    if (e.touches.length === 1) {
      this.lastTouchX     = e.touches[0].clientX;
      this.lastTouchY     = e.touches[0].clientY;
      this.touchStartX    = e.touches[0].clientX;
      this.touchStartY    = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    }
    if (e.changedTouches.length === 0) return;
    const t        = e.changedTouches[0];
    const dx       = t.clientX - this.touchStartX;
    const dy       = t.clientY - this.touchStartY;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
    const elapsed  = Date.now() - this.touchStartTime;

    if (moveDist < 8 && elapsed < 300) {
      const since   = Date.now() - this.lastTapTime;
      const ddx     = t.clientX - this.lastTapX;
      const ddy     = t.clientY - this.lastTapY;
      const tapDist = Math.sqrt(ddx * ddx + ddy * ddy);

      if (since < 300 && tapDist < 30) {
        // Cancel pending single-tap so it doesn't fire alongside double-tap
        if (this._tapTimer !== null) {
          clearTimeout(this._tapTimer);
          this._tapTimer = null;
        }
        this.onDoubleTap?.(t.clientX, t.clientY);
        this.lastTapTime = 0;
      } else {
        // Delay single-tap to give a second tap a chance to cancel it
        const tapX = t.clientX;
        const tapY = t.clientY;
        this.lastTapX    = tapX;
        this.lastTapY    = tapY;
        this.lastTapTime = Date.now();
        this._tapTimer = setTimeout(() => {
          this._tapTimer = null;
          this.onTap?.(tapX, tapY);
        }, 300);
      }
    }
  };

  lookAt(target: THREE.Vector3) {
    const dx = target.x - this.camera.position.x;
    const dy = target.y - this.camera.position.y;
    const dz = target.z - this.camera.position.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    this.targetYaw   = null;
    this.targetPitch = null;
    this.yaw   = Math.atan2(-dx, -dz);
    this.pitch = Math.atan2(dy, horizDist);
  }

  smoothLookAt(target: THREE.Vector3) {
    const dx = target.x - this.camera.position.x;
    const dy = target.y - this.camera.position.y;
    const dz = target.z - this.camera.position.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    this.targetYaw   = Math.atan2(-dx, -dz);
    this.targetPitch = Math.atan2(dy, horizDist);
  }

  update() {
    // Programmatic yaw animation
    if (this.targetYaw !== null) {
      let d = this.targetYaw - this.yaw;
      d = d - 2 * Math.PI * Math.round(d / (2 * Math.PI));
      if (Math.abs(d) < 0.003) {
        this.yaw = this.targetYaw;
        this.targetYaw = null;
      } else {
        this.yaw += d * debugState.yawTurnSpeed;
      }
    }

    // Programmatic pitch animation
    if (this.targetPitch !== null) {
      const d = this.targetPitch - this.pitch;
      if (Math.abs(d) < 0.003) {
        this.pitch = this.targetPitch;
        this.targetPitch = null;
      } else {
        this.pitch += d * debugState.yawTurnSpeed;
      }
    }

    // Apply yaw + pitch to camera quaternion
    this._euler.set(this.pitch, this.yaw, 0);
    this.camera.quaternion.setFromEuler(this._euler);

    if (!this.isLocked || this.frozen) return;
    // WASD movement (desktop only — mobile has no keyboard)
    if (this.isMobile) return;
    this._dir.set(0, 0, 0);
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp'))    this._dir.z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown'))  this._dir.z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft'))  this._dir.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this._dir.x += 1;
    if (this._dir.lengthSq() === 0) return;

    this._dir.normalize().multiplyScalar(MOVE_SPEED);
    this._yawEuler.set(0, this.yaw, 0);
    this._dir.applyQuaternion(this._quat.setFromEuler(this._yawEuler));

    const p = this.camera.position;
    p.x = Math.max(CAM_XMIN, Math.min(CAM_XMAX, p.x + this._dir.x));
    p.z = Math.max(CAM_ZMIN, Math.min(CAM_ZMAX, p.z + this._dir.z));
  }
}

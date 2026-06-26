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

  private readonly _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _yawEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _quat = new THREE.Quaternion();
  private readonly _dir = new THREE.Vector3();

  constructor(private camera: THREE.PerspectiveCamera, initialYaw = 0) {
    this.yaw = initialYaw;
  }

  animateYawTo(target: number) {
    this.targetYaw = target;
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.addEventListener('click', this.onClick);
    document.addEventListener('pointerlockchange', this.onLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  detach() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('click', this.onClick);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
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
    this.targetYaw   = null; // user took control — cancel programmatic pan
    this.targetPitch = null;
    this.yaw -= e.movementX * LOOK_SENSITIVITY;
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
      d = d - 2 * Math.PI * Math.round(d / (2 * Math.PI)); // shortest arc, works for any accumulated yaw
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

    // WASD movement in camera-local XZ
    if (!this.isLocked || this.frozen) return;
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

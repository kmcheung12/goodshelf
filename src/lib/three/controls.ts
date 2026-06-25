import * as THREE from 'three';
import {
  LOOK_SENSITIVITY, PITCH_LIMIT, MOVE_SPEED,
  CAM_XMIN, CAM_XMAX, CAM_ZMIN, CAM_ZMAX,
  CAM_FOV_MIN, CAM_FOV_MAX,
} from './constants';

export class Controls {
  private yaw = 0;
  private pitch = 0;
  private canvas: HTMLCanvasElement | null = null;
  private keys = new Set<string>();
  public isLocked = false;

  constructor(private camera: THREE.PerspectiveCamera) {}

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
    if (!this.isLocked) return;
    this.yaw -= e.movementX * LOOK_SENSITIVITY;
    this.pitch -= e.movementY * LOOK_SENSITIVITY;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
  };

  private onKeyDown = (e: KeyboardEvent) => { this.keys.add(e.code); };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const fov = this.camera.fov + e.deltaY * 0.05;
    this.camera.fov = Math.max(CAM_FOV_MIN, Math.min(CAM_FOV_MAX, fov));
    this.camera.updateProjectionMatrix();
  };

  update() {
    // Apply yaw + pitch to camera quaternion
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // WASD movement in camera-local XZ
    if (!this.isLocked) return;
    const dir = new THREE.Vector3();
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp'))    dir.z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown'))  dir.z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft'))  dir.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dir.x += 1;
    if (dir.lengthSq() === 0) return;

    dir.normalize().multiplyScalar(MOVE_SPEED);
    dir.applyQuaternion(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yaw, 0))
    );

    const p = this.camera.position;
    p.x = Math.max(CAM_XMIN, Math.min(CAM_XMAX, p.x + dir.x));
    p.z = Math.max(CAM_ZMIN, Math.min(CAM_ZMAX, p.z + dir.z));
  }
}

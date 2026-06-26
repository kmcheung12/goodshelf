import GUI from 'lil-gui';
import type * as THREE from 'three';
import {
  SPINE_ROUGHNESS_MIN, SPINE_ROUGHNESS_MAX,
  SPINE_NORMAL_SCALE, SPINE_GRAIN_STRENGTH, SPINE_EDGE_DARKEN,
  DEBUG_SHADOW_RADIUS, DEBUG_HEIGHT_SCALE, DEBUG_DEPTH_SCALE,
  DEBUG_SHELF_WIDTH_SCALE, DEBUG_INSPECT_FILL, DEBUG_LUMINANCE_THRESHOLD,
  DEBUG_YAW_TURN_SPEED, DEBUG_LOADING_DIM,
} from './constants';

export interface DebugState {
  shadowRadius: number;
  heightScale: number;
  depthScale: number;
  shelfWidthScale: number;
  normalScale: number;
  roughnessMin: number;
  roughnessMax: number;
  grainStrength: number;
  edgeDarken: number;
  inspectFillIntensity: number;
  luminanceThreshold: number;
  yawTurnSpeed: number;
  loadingDim: number;
}

export const debugState: DebugState = {
  shadowRadius:       DEBUG_SHADOW_RADIUS,
  heightScale:        DEBUG_HEIGHT_SCALE,
  depthScale:         DEBUG_DEPTH_SCALE,
  shelfWidthScale:    DEBUG_SHELF_WIDTH_SCALE,
  normalScale:        SPINE_NORMAL_SCALE,
  roughnessMin:       SPINE_ROUGHNESS_MIN,
  roughnessMax:       SPINE_ROUGHNESS_MAX,
  grainStrength:      SPINE_GRAIN_STRENGTH,
  edgeDarken:         SPINE_EDGE_DARKEN,
  inspectFillIntensity: DEBUG_INSPECT_FILL,
  luminanceThreshold: DEBUG_LUMINANCE_THRESHOLD,
  yawTurnSpeed: DEBUG_YAW_TURN_SPEED,
  loadingDim:   DEBUG_LOADING_DIM,
};

export function buildDebugGUI(
  shadowLight: THREE.DirectionalLight,
  onRelayout: () => void,
  onRelayoutWithShelves: () => void = onRelayout,
): GUI {
  const gui = new GUI({ title: 'Debug' });
  gui.close();

  gui.add(debugState, 'shadowRadius', 0, 12, 0.5)
    .name('Shadow radius')
    .onChange((v: number) => {
      shadowLight.shadow.radius = v;
    });

  gui.add(debugState, 'heightScale', 0, 2, 0.05)
    .name('Height randomness')
    .onFinishChange(onRelayout);

  gui.add(debugState, 'depthScale', 0, 2, 0.05)
    .name('Depth randomness')
    .onFinishChange(onRelayout);

  gui.add(debugState, 'shelfWidthScale', 0.5, 1, 0.01)
    .name('Shelf width')
    .onFinishChange(onRelayoutWithShelves);

  gui.add(debugState, 'yawTurnSpeed', 0.01, 0.2, 0.01)
    .name('Turn speed');

  gui.add(debugState, 'loadingDim', 0, 1, 0.01)
    .name('Loading dim');

  gui.add(debugState, 'inspectFillIntensity', 0, 5, 0.1)
    .name('Inspect fill light');

  const spineFolder = gui.addFolder('Spine');

  spineFolder.add(debugState, 'normalScale', 0, 2, 0.05)
    .name('Normal scale')
    .onFinishChange(onRelayout);

  spineFolder.add(debugState, 'roughnessMin', 0, 1, 0.05)
    .name('Roughness min')
    .onFinishChange(onRelayout);

  spineFolder.add(debugState, 'roughnessMax', 0, 1, 0.05)
    .name('Roughness max')
    .onFinishChange(onRelayout);

  spineFolder.add(debugState, 'grainStrength', 0, 30, 1)
    .name('Grain strength')
    .onFinishChange(onRelayout);

  spineFolder.add(debugState, 'edgeDarken', 0, 1, 0.01)
    .name('Edge darken')
    .onFinishChange(onRelayout);

  spineFolder.add(debugState, 'luminanceThreshold', 0, 1, 0.01)
    .name('Luminance threshold')
    .onFinishChange(onRelayout);

  return gui;
}

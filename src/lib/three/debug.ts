import GUI from 'lil-gui';
import type * as THREE from 'three';

export interface DebugState {
  shadowRadius: number;
  heightScale: number;
  depthScale: number;
  shelfWidthScale: number;
}

export const debugState: DebugState = {
  shadowRadius: 3,
  heightScale: 1,
  depthScale: 1,
  shelfWidthScale: 1,
};

export function buildDebugGUI(
  shadowLight: THREE.DirectionalLight,
  onRelayout: () => void,
  onRelayoutWithShelves: () => void = onRelayout,
): GUI {
  const gui = new GUI({ title: 'Debug' });

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

  return gui;
}

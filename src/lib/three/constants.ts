// Room dimensions (metres)
export const ROOM_HALF_W = 0.85;   // ±X
export const ROOM_HALF_D = 0.75;   // ±Z (entrance at +Z)
export const ROOM_HEIGHT = 2.40;

// Camera
export const CAM_START_X = 0;
export const CAM_START_Y = 1.36;
export const CAM_START_Z = 0.3;
export const CAM_FOV = 72;
export const CAM_FOV_MIN = 30;
export const CAM_FOV_MAX = 72;
export const CAM_NEAR = 0.01;
export const CAM_FAR = 20;
export const COLOR_SCENE_BG = '#0b0b0d';
export const TONE_MAPPING_EXPOSURE = 1.0;
export const CAM_XMIN = -0.43;
export const CAM_XMAX = 0.43;
export const CAM_ZMIN = -0.29;
export const CAM_ZMAX = 0.77;

// Controls
export const LOOK_SENSITIVITY = 0.0022;
export const PITCH_LIMIT = 1.48;          // radians
export const MOVE_SPEED = 0.008;
export const SCROLL_ZOOM_SPEED = 0.05;

// Shelves
export const SHELF_ROWS = 10;
export const SHELF_Y0 = 0.16;             // lowest shelf surface Y
export const SHELF_DY = 0.215;            // vertical spacing between shelves
export const CASE_HEIGHT = 0.185;
export const CASE_DEPTH = 0.135;
export const SPINE_THICKNESS = 0.0265;
export const SHELF_PLANK_THICKNESS = 0.018;
export const SHELF_WALL_GAP = 0.018;      // case back to wall
export const CORNER_GAP = 0.08;           // side walls stop short of back wall

// Colors
export const COLOR_WOOD = '#8a7f62';
export const COLOR_WALL = '#cdc6b6';
export const COLOR_FLOOR = '#2f2417';
export const COLOR_CEILING = '#f2efe7';

// Room geometry
export const WALL_THICKNESS = 0.05;

// Lighting
export const HEMI_SKY = '#fff3df';
export const HEMI_GROUND = '#241f17';
export const HEMI_INTENSITY = 0.25;
export const AMBIENT_INTENSITY = 0.12;
export const KEY_COLOR = '#ffead0';
export const KEY_INTENSITY = 0.42;
export const KEY_LIGHT_X = 0.7;
export const KEY_LIGHT_Y = 3.6;
export const KEY_LIGHT_Z = 0.9;
export const KEY_SHADOW_NEAR = 0.1;
export const KEY_SHADOW_FAR = 10;
export const KEY_SHADOW_LEFT = -2;
export const KEY_SHADOW_RIGHT = 2;
export const KEY_SHADOW_TOP = 3;
export const KEY_SHADOW_BOTTOM = -1;
export const LAMP_CEILING_OFFSET = 0.05;
export const LAMP_X_FACTOR = 0.4;
export const POINT_COLOR = '#ffe6c0';
export const POINT_INTENSITY = 2.8;
export const POINT_DECAY = 1.8;

// Book mesh
export const BOOK_HOVER_OFFSET = 0.04;   // metres forward on hover
export const BOOK_HOVER_LERP = 0.12;
export const DRAG_THRESHOLD_PX = 4;
export const BOOK_DEPTH_VARIATION = 0.012; // ±metres random depth variation on shelf

// Book inspect (fly-out) mode
export const INSPECT_DISTANCE = 0.42;    // metres held in front of camera
export const INSPECT_TILT_X = 0.28;     // max pitch tilt from mouse (radians)
export const INSPECT_TILT_Y = 0.38;     // max yaw tilt from mouse (radians)
export const INSPECT_POS_LERP = 0.10;
export const INSPECT_ROT_LERP = 0.10;
export const SPINE_CANVAS_W = 76;         // px
export const SPINE_CANVAS_H = 540;        // px
export const SPINE_ROUGHNESS = 0.55;
export const SPINE_METALNESS = 0.03;

// Spine color palette (30 colours, seeded by book index)
export const SPINE_PALETTE = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#2b2d42', '#ef233c', '#d62828', '#f77f00',
  '#fcbf49', '#023e8a', '#0077b6', '#00b4d8',
  '#264653', '#2a9d8f', '#e9c46a', '#f4a261',
  '#e76f51', '#6d6875', '#b5838d', '#c77dff',
  '#4a4e69', '#9a8c98', '#7b2d8b', '#3d405b',
  '#81b29a', '#f2cc8f', '#e07a5f', '#8ecae6',
  '#f4f1de', '#2d3142',
] as const;

// Shelf capacity (derived from room geometry)
// Back wall: (ROOM_HALF_W*2 - WALL_THICKNESS) / SPINE_THICKNESS ≈ 62
export const SHELF_BACK_BOOKS_PER_ROW = 62;
// Side walls: (ROOM_HALF_D*2 - CORNER_GAP - WALL_THICKNESS) / SPINE_THICKNESS ≈ 52
export const SHELF_SIDE_BOOKS_PER_ROW = 52;

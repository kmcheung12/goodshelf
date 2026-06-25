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
export const CAM_XMIN = -0.43;
export const CAM_XMAX = 0.43;
export const CAM_ZMIN = -0.29;
export const CAM_ZMAX = 0.77;

// Controls
export const LOOK_SENSITIVITY = 0.0022;
export const PITCH_LIMIT = 1.48;          // radians
export const MOVE_SPEED = 0.008;

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
export const HEMI_INTENSITY = 0.62;
export const AMBIENT_INTENSITY = 0.34;
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
export const POINT_INTENSITY = 1.35;
export const POINT_DECAY = 2;

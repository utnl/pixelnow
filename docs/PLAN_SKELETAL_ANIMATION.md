# Implementation Plan: Skeletal Animation System (Bone Rigging)

## 1. Motivation
The user wants to implement "Bone Rigging" (Skeletal Animation) to differentiate PixelNow from Aseprite. This allows high-quality, smooth animations with minimal asset redundancy (reusing body parts) and enables sophisticated game mechanics (switching weapons/armor at runtime).

## 2. Architecture Overview
We are moving from a **Flat Bitmap Layer** system to a **Hierarchical Scene Graph** system.

### Current System:
- `LayerManager.layers`: Array of flat raster layers.
- Drawing happens at `(x, y)` global coordinates targeting the active layer.

### New System:
- **`PixelNode` (Abstract)**: Base class for all elements in the scene (extends `PIXI.Container` conceptually).
  - Properties: `position`, `rotation`, `scale`, `pivot`, `visible`, `alpha`, `children`.
- **`BoneNode` (extends PixelNode)**: A container used for grouping and pivoting (has no pixel data).
- **`LayerNode` (extends PixelNode)**: A drawable layer containing `Uint32Array` pixel data.
- **`SceneGraph`**: Replaces the flat list. The graphics container handles the visual hierarchy.

## 3. Key Technical Challenges & Solutions

### A. Coordinate Systems (Crucial)
When drawing on a rotated/scaled layer, we must transform the Mouse Pointer (Screen/Global Space) into **Layer Local Space**.
- **Math**: `localPoint = node.transform.worldTransform.applyInverse(globalPoint)`
- **Impact**: All Tools (`Pencil`, `Eraser`, `Fill`) must be updated to use `localPoint` for editing the `Uint32Array`.

### B. "Mixels" (Rotated Pixels)
Rotated pixel art can look distorted ("Mixels") because the source pixels (texels) don't align with the screen pixels.
- **Solution**: Use `nearest` neighbor interpolation. It looks like "Retro Console rotating sprites".

## 4. Implementation Stages

### Phase 1: Core Hierarchy Refactor
1.  **Define `PixelNode` Structure**: Create the classes.
2.  **Refactor `LayerManager`**: Replace `layers: Layer[]` with `root: BoneNode`.
3.  **Update Rendering**: Ensure PIXI rendering respects the hierarchy.
4.  **UI Updates**: Update the "Layers" panel to a "Tree View" (Outliner).

### Phase 2: Interaction Tools
1.  **Pivot Tool**: Allow changing the center of rotation for a node.
2.  **Transform Tool**: A new tool (Gizmo) to Rotate/Translate/Scale nodes visually.
3.  **Coordinate Mapping**: Update `PencilTool` etc. to support drawing on rotated layers.

### Phase 3: Animation Timeline
1.  **Keyframe Properties**: `AnimationManager` needs to store `node.transform` per frame.
2.  **Tweening**: Implement linear interpolation between frames.

## 5. Recommendation
Start with **Phase 1**. This is a breaking change for the engine logic, so it's better to do it early.

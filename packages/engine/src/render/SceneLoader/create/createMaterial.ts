import {
  Color,
  DoubleSide,
  FrontSide,
  MeshStandardMaterial,
  sRGBEncoding,
} from "three";

import { Material } from "../../../scene";
import { RenderScene } from "../../RenderScene";
import { removeMaterial } from "../remove/removeMaterial";
import { SceneMap } from "../types";
import { createTexture } from "./createTexture";

export function createMaterial(
  material: Material,
  map: SceneMap,
  scene: RenderScene
) {
  const materialObject = new MeshStandardMaterial();
  map.materials.set(material.id, materialObject);

  // Subscribe to material updates
  material.alpha$.subscribe({
    next: (alpha) => {
      materialObject.opacity = alpha;
    },
    complete: () => {
      // Remove three material when material is removed
      // Nothing special about this callback, could be added to any of these subscriptions
      removeMaterial(material.id, map);
    },
  });

  material.alphaMode$.subscribe({
    next: (alphaMode) => {
      if (alphaMode === "BLEND") {
        materialObject.transparent = true;
        materialObject.depthWrite = false;
      } else {
        materialObject.transparent = false;
        materialObject.depthWrite = true;

        if (alphaMode === "MASK") {
          material.alphaCutoff$.subscribe({
            next: (alphaCutoff) => {
              materialObject.alphaTest = alphaCutoff;
            },
          });
        }
      }
    },
  });

  material.doubleSided$.subscribe({
    next: (doubleSided) => {
      materialObject.side = doubleSided ? DoubleSide : FrontSide;
    },
  });

  material.emissive$.subscribe({
    next: (emissive) => {
      materialObject.emissive = new Color().fromArray(emissive);
    },
  });

  material.normalScale$.subscribe({
    next: (normalScale) => {
      materialObject.normalScale.set(normalScale, normalScale);
    },
  });

  material.occlusionStrength$.subscribe({
    next: (occlusionStrength) => {
      materialObject.aoMapIntensity = occlusionStrength;
    },
  });

  material.color$.subscribe({
    next: (color) => {
      materialObject.color = new Color().fromArray(color);
    },
  });

  material.roughness$.subscribe({
    next: (roughness) => {
      materialObject.roughness = roughness;
    },
  });

  material.metalness$.subscribe({
    next: (metalness) => {
      materialObject.metalness = metalness;
    },
  });

  material.colorTexture$.subscribe({
    next: (colorTexture) => {
      const texture = colorTexture ? createTexture(colorTexture, scene) : null;
      if (texture) texture.encoding = sRGBEncoding;

      materialObject.map = texture;
    },
  });

  material.normalTexture$.subscribe({
    next: (normalTexture) => {
      const texture = normalTexture
        ? createTexture(normalTexture, scene)
        : null;

      materialObject.normalMap = texture;
    },
  });

  material.occlusionTexture$.subscribe({
    next: (occlusionTexture) => {
      const texture = occlusionTexture
        ? createTexture(occlusionTexture, scene)
        : null;

      materialObject.aoMap = texture;
    },
  });

  material.emissiveTexture$.subscribe({
    next: (emissiveTexture) => {
      const texture = emissiveTexture
        ? createTexture(emissiveTexture, scene)
        : null;
      if (texture) texture.encoding = sRGBEncoding;

      materialObject.emissiveMap = texture;
    },
  });

  material.metallicRoughnessTexture$.subscribe({
    next: (metallicRoughnessTexture) => {
      const texture = metallicRoughnessTexture
        ? createTexture(metallicRoughnessTexture, scene)
        : null;

      materialObject.metalnessMap = texture;
      materialObject.roughnessMap = texture;
    },
  });
}
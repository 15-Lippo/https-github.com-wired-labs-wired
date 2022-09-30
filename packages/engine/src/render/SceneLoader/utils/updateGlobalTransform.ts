import { Quaternion, Vector3 } from "three";

import { Quad } from "../../../types";
import { RenderScene } from "../../RenderScene";
import { SceneMap } from "../types";

const tempVector3 = new Vector3();
const tempQuaternion = new Quaternion();

export function updateGlobalTransform(
  entityId: string,
  map: SceneMap,
  scene: RenderScene
) {
  const object = map.objects.get(entityId);
  if (!object) throw new Error("Object not found");

  const globalPosition = object.getWorldPosition(tempVector3);
  const globalQuaternion = object.getWorldQuaternion(tempQuaternion);

  const quaternion: Quad = [
    globalQuaternion.x,
    globalQuaternion.y,
    globalQuaternion.z,
    globalQuaternion.w,
  ];

  scene.updateGlobalTransform(entityId, globalPosition.toArray(), quaternion);
}
import { useEffect, useState } from "react";
import { Euler, Group, Quaternion, Vector3 } from "three";

import { Entity, IModule, Transform } from "../../../types";
import { COLLIDER_COMPONENTS } from "../../../modules";
import { DEFAULT_TRANSFORM } from "../../../constants";

const tempVector3 = new Vector3();
const tempQuaternion = new Quaternion();
const tempEuler = new Euler();

interface Props {
  module: IModule;
  entity: Entity;
  entityRef: React.RefObject<Group>;
}

export default function ColliderModule({ module, entity, entityRef }: Props) {
  const [key, setKey] = useState(0);
  const [absoluteTransform, setAbsoluteTransform] = useState(DEFAULT_TRANSFORM);

  useEffect(() => {
    const interval = setInterval(() => {
      const matrix = entityRef.current?.matrixWorld;
      if (!matrix) return;

      const position = entityRef.current
        .getWorldPosition(tempVector3)
        .toArray();
      const rotation = tempVector3
        .setFromEuler(
          tempEuler.setFromQuaternion(
            entityRef.current.getWorldQuaternion(tempQuaternion)
          )
        )
        .toArray();
      const scale = entityRef.current.getWorldScale(tempVector3).toArray();

      setAbsoluteTransform({
        position,
        rotation,
        scale,
      });
    }, 100);

    return () => clearInterval(interval);
  }, [entity, entityRef]);

  //cannon physics objects cant change args once created
  //remount the component every time they change
  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [entity, absoluteTransform]);

  const Component = COLLIDER_COMPONENTS[module.variation];
  return (
    <Component
      key={key}
      {...(module.props as any)}
      transform={absoluteTransform}
    />
  );
}

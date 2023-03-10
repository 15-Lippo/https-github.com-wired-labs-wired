import { ColliderExtension, SPAWN_TITLES } from "engine";
import { useState } from "react";

import Button from "../../../ui/Button";
import DropdownMenu from "../../../ui/DropdownMenu";
import { useNode } from "../../hooks/useNode";
import { useNodeAttribute } from "../../hooks/useNodeAttribute";
import { useSpawn } from "../../hooks/useSpawn";
import { useEditorStore } from "../../store";
import MeshComponent from "./mesh/MeshComponent";
import PhysicsComponent from "./PhysicsComponent";
import SpawnPointComponent from "./SpawnPointComponent";
import TransformComponent from "./TransformComponent";

const COMPONENT_TYPE = {
  Mesh: "Mesh",
  Physics: "Physics",
  SpawnPoint: "Spawn Point",
} as const;

type ComponentType = (typeof COMPONENT_TYPE)[keyof typeof COMPONENT_TYPE];

export default function InspectMenu() {
  const selectedId = useEditorStore((state) => state.selectedId);
  const node = useNode(selectedId);
  const name = useNodeAttribute(selectedId, "name");
  const meshId = useNodeAttribute(selectedId, "mesh");
  const extensions = useNodeAttribute(selectedId, "extensions");
  const spawn = useSpawn();

  const [open, setOpen] = useState(false);

  if (!node || !selectedId) return null;

  const availableComponents: ComponentType[] = [];

  if (!meshId) availableComponents.push(COMPONENT_TYPE.Mesh);
  if (!extensions?.OMI_collider) availableComponents.push(COMPONENT_TYPE.Physics);
  if (!extensions?.OMI_spawn_point && !spawn) availableComponents.push(COMPONENT_TYPE.SpawnPoint);

  return (
    <div className="pr-2">
      <div className="flex w-full items-center justify-center pt-4">
        <input
          type="text"
          value={name ?? ""}
          onChange={(e) => {
            node.setName(e.target.value);
          }}
          className="mx-10 w-full rounded-lg py-0.5 text-center text-2xl font-bold ring-inset ring-neutral-300 transition hover:bg-neutral-100 hover:ring-1 focus:bg-neutral-100"
        />
      </div>

      <div className="space-y-4 px-1">
        <TransformComponent nodeId={selectedId} />

        {meshId && <MeshComponent meshId={meshId} />}
        {extensions?.OMI_collider && <PhysicsComponent nodeId={selectedId} />}
        {extensions?.OMI_spawn_point && <SpawnPointComponent nodeId={selectedId} />}

        {availableComponents.length > 0 && (
          <div className="space-y-1 px-5">
            <Button onClick={() => setOpen(true)} className="w-full rounded-lg">
              Add Component
            </Button>

            <DropdownMenu open={open} onClose={() => setOpen(false)} fullWidth>
              <div className="space-y-1 p-2">
                {availableComponents.includes("Mesh") && (
                  <ComponentButton
                    onClick={() => {
                      const { engine } = useEditorStore.getState();
                      if (!engine) return;

                      const { object: mesh } = engine.scene.mesh.create({
                        extras: {
                          customMesh: {
                            type: "Box",
                            width: 1,
                            height: 1,
                            depth: 1,
                          },
                        },
                      });

                      node.setMesh(mesh);
                    }}
                  >
                    {COMPONENT_TYPE.Mesh}
                  </ComponentButton>
                )}

                {availableComponents.includes(COMPONENT_TYPE.Physics) && (
                  <ComponentButton
                    onClick={() => {
                      const { engine } = useEditorStore.getState();
                      if (!engine) return;

                      const collider = engine.scene.extensions.collider.createCollider();
                      collider.type = "trimesh";

                      node.setExtension(ColliderExtension.EXTENSION_NAME, collider);
                    }}
                  >
                    {COMPONENT_TYPE.Physics}
                  </ComponentButton>
                )}

                {availableComponents.includes(COMPONENT_TYPE.SpawnPoint) && (
                  <ComponentButton
                    onClick={() => {
                      const { engine } = useEditorStore.getState();
                      if (!engine) return;

                      const spawnPoint = engine.scene.extensions.spawn.createSpawnPoint();
                      spawnPoint.title = SPAWN_TITLES.Default;
                      node.setExtension("OMI_spawn_point", spawnPoint);
                    }}
                  >
                    {COMPONENT_TYPE.SpawnPoint}
                  </ComponentButton>
                )}
              </div>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentButton({ children, ...props }: any) {
  return (
    <button className="w-full cursor-default rounded-lg transition hover:bg-neutral-200" {...props}>
      {children}
    </button>
  );
}

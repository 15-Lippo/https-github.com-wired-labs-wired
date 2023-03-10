import { Collider, ColliderDesc, RigidBodyDesc, TriMesh, World } from "@dimforge/rapier3d";
import { Node } from "@gltf-transform/core";

import { NodeJSON } from "../scene";
import { SceneMessage } from "../scene/messages";
import { Scene } from "../scene/Scene";
import { Vec3 } from "../types";
import { COLLISION_GROUP } from "./groups";

export class PhysicsScene extends Scene {
  #world: World;

  colliders = new Map<string, Collider>();
  colliderScale = new Map<string, Vec3>();

  constructor(world: World) {
    super();

    this.#world = world;
  }

  onmessage = ({ subject, data }: SceneMessage) => {
    switch (subject) {
      case "create_buffer": {
        this.buffer.create(data.json, data.id);
        break;
      }

      case "dispose_buffer": {
        const buffer = this.buffer.store.get(data);
        if (!buffer) throw new Error("Buffer not found");
        buffer.dispose();
        break;
      }

      case "create_accessor": {
        this.accessor.create(data.json, data.id);
        break;
      }

      case "dispose_accessor": {
        const accessor = this.accessor.store.get(data);
        if (!accessor) throw new Error("Accessor not found");
        accessor.dispose();
        break;
      }

      case "create_primitive": {
        if (data.json.material) data.json.material = null;
        this.primitive.create(data.json, data.id);
        break;
      }

      case "change_primitive": {
        if (data.json.material) data.json.material = null;

        const primitive = this.primitive.store.get(data.id);
        if (!primitive) throw new Error("Primitive not found");
        this.primitive.applyJSON(primitive, data.json);
        break;
      }

      case "dispose_primitive": {
        const primitive = this.primitive.store.get(data);
        if (!primitive) throw new Error("Primitive not found");
        primitive.dispose();
        break;
      }

      case "create_mesh": {
        this.mesh.create(data.json, data.id);
        break;
      }

      case "change_mesh": {
        const mesh = this.mesh.store.get(data.id);
        if (!mesh) throw new Error("Mesh not found");

        this.mesh.applyJSON(mesh, data.json);

        mesh.listParents().forEach((parent) => {
          if (parent instanceof Node) {
            const nodeId = this.node.getId(parent);
            if (!nodeId) throw new Error("Node not found");

            const json = this.node.toJSON(parent);

            this.#updateNode(nodeId, { extensions: json.extensions });
          }
        });
        break;
      }

      case "dispose_mesh": {
        const mesh = this.mesh.store.get(data);
        if (!mesh) throw new Error("Mesh not found");
        mesh.dispose();
        break;
      }

      case "create_node": {
        const { object: node } = this.node.create(data.json, data.id);

        node.addEventListener("dispose", () => {
          this.#removeNodeCollider(data.id);
        });

        node.addEventListener("change", (e) => {
          const attribute = e.attribute as keyof NodeJSON;

          if (attribute === "translation" || attribute === "rotation" || attribute === "scale") {
            this.#updateNodeTransform(data.id);
          }
        });

        this.#updateNodeCollider(data.id);
        this.#updateNodeTransform(data.id);
        break;
      }

      case "change_node": {
        const node = this.node.store.get(data.id);
        if (!node) throw new Error("Node not found");

        this.node.applyJSON(node, data.json);

        this.#updateNode(data.id, data.json);
        break;
      }

      case "dispose_node": {
        const node = this.node.store.get(data);
        if (!node) throw new Error("Node not found");
        node.dispose();
        break;
      }
    }
  };

  #updateNode(nodeId: string, json: Partial<NodeJSON>) {
    const colliderJSON = json.extensions?.OMI_collider;

    if (colliderJSON !== undefined) {
      // Remove existing collider
      this.#removeNodeCollider(nodeId);

      // Create new collider
      if (colliderJSON) {
        let colliderDesc: ColliderDesc | undefined;

        switch (colliderJSON.type) {
          case "box": {
            const size = colliderJSON.size ?? [1, 1, 1];
            colliderDesc = ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2);
            break;
          }

          case "sphere": {
            const radius = colliderJSON.radius ?? 0.5;
            colliderDesc = ColliderDesc.ball(radius);
            break;
          }

          case "cylinder": {
            const height = colliderJSON.height ?? 1;
            const radius = colliderJSON.radius ?? 0.5;
            colliderDesc = ColliderDesc.cylinder(height / 2, radius);
            break;
          }

          case "trimesh": {
            if (!colliderJSON.mesh) break;

            const mesh = this.mesh.store.get(colliderJSON.mesh);
            if (!mesh) throw new Error("Mesh not found");

            const vertices = mesh.listPrimitives().flatMap((primitive) => {
              const attribute = primitive.getAttribute("POSITION");
              if (!attribute) throw new Error("Position attribute not found");

              const array = attribute.getArray();
              if (!array) throw new Error("Position attribute array not found");

              return Array.from(array);
            });

            const indices = mesh.listPrimitives().flatMap((primitive) => {
              const indicesAttribute = primitive.getIndices();
              if (!indicesAttribute) throw new Error("Indices attribute not found");

              const array = indicesAttribute.getArray();
              if (!array) throw new Error("Indices attribute array not found");

              return Array.from(array);
            });

            if (vertices.length === 0 || indices.length === 0) break;

            colliderDesc = ColliderDesc.trimesh(
              Float32Array.from(vertices),
              Uint32Array.from(indices)
            );
          }
        }

        if (!colliderDesc) return;

        colliderDesc.setCollisionGroups(COLLISION_GROUP.static);

        const rigidBodyDesc = RigidBodyDesc.fixed();
        const rigidBody = this.#world.createRigidBody(rigidBodyDesc);
        const collider = this.#world.createCollider(colliderDesc, rigidBody);

        this.colliders.set(nodeId, collider);

        this.#updateNodeTransform(nodeId);
      }
    }
  }

  #removeNodeCollider(nodeId: string) {
    const collider = this.colliders.get(nodeId);
    if (collider) {
      // Remove rigid body
      const rigidBody = collider.parent();
      if (rigidBody) this.#world.removeRigidBody(rigidBody);

      // Remove collider
      this.#world.removeCollider(collider, true);

      this.colliders.delete(nodeId);
      this.colliderScale.delete(nodeId);
    }
  }

  #updateNodeCollider(nodeId: string) {
    const node = this.node.store.get(nodeId);
    if (!node) throw new Error("Node not found");

    const json = this.node.toJSON(node);

    this.#updateNode(nodeId, { extensions: json.extensions });
  }

  #updateNodeTransform(nodeId: string) {
    const node = this.node.store.get(nodeId);
    if (!node) throw new Error("Node not found");

    const worldTranslation = node.getWorldTranslation();
    const worldRotation = node.getWorldRotation();
    const worldScale = node.getWorldScale();

    const collider = this.colliders.get(nodeId);

    if (collider) {
      if (collider.shape instanceof TriMesh) {
        const prevScale = this.colliderScale.get(nodeId) ?? [1, 1, 1];
        const sameScale = prevScale.every((value, index) => value === worldScale[index]);

        if (!sameScale) {
          // Apply scale to vertices
          const vertices = collider.shape.vertices;

          for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] *= worldScale[0] / prevScale[0];
            vertices[i + 1] *= worldScale[1] / prevScale[1];
            vertices[i + 2] *= worldScale[2] / prevScale[2];
          }

          // Create new collider
          const newColliderDesc = ColliderDesc.trimesh(vertices, collider.shape.indices);
          newColliderDesc.setCollisionGroups(COLLISION_GROUP.static);

          const rigidBody = collider.parent();
          if (!rigidBody) throw new Error("RigidBody not found");

          const newCollider = this.#world.createCollider(newColliderDesc, rigidBody);
          this.colliders.set(nodeId, newCollider);

          // Remove old collider
          this.#world.removeCollider(collider, true);

          // Update scale
          this.colliderScale.set(nodeId, worldScale);
        }
      }

      const rigidBody = collider.parent();

      if (rigidBody) {
        rigidBody.setTranslation(
          {
            x: worldTranslation[0],
            y: worldTranslation[1],
            z: worldTranslation[2],
          },
          true
        );

        rigidBody.setRotation(
          {
            x: worldRotation[0],
            y: worldRotation[1],
            z: worldRotation[2],
            w: worldRotation[3],
          },
          true
        );
      }
    }

    // Update children
    for (const child of node.listChildren()) {
      const childId = this.node.getId(child);
      if (childId) this.#updateNodeTransform(childId);
    }
  }
}

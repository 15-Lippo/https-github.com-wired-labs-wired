import { BehaviorSubject } from "rxjs";

import { Entity, EntityJSON, Material, SceneMessage } from "../../scene";
import { PostMessage, Triplet } from "../../types";
import { FromRenderMessage } from "../types";

/*
 * RenderScene stores the scene state needed for the {@link RenderWorker}.
 * State is synced with the {@link MainScene}.
 */
export class RenderScene {
  #toMainThread: PostMessage<FromRenderMessage>;

  constructor(postMessage: PostMessage<FromRenderMessage>) {
    this.#toMainThread = postMessage;

    const root = new Entity({ id: "root" });
    this.#addEntity(root);
  }

  entities$ = new BehaviorSubject<{ [id: string]: Entity }>({});
  materials$ = new BehaviorSubject<{ [id: string]: Material }>({});

  get entities() {
    return this.entities$.value;
  }

  set entities(entities: { [id: string]: Entity }) {
    this.entities$.next(entities);
  }

  get materials() {
    return this.materials$.value;
  }

  set materials(materials: { [id: string]: Material }) {
    this.materials$.next(materials);
  }

  onmessage = (event: MessageEvent<SceneMessage>) => {
    const { subject, data } = event.data;

    switch (subject) {
      case "add_entity":
        this.#addEntity(Entity.fromJSON(data.entity));
        break;
      case "remove_entity":
        this.#removeEntity(data.entityId);
        break;
      case "update_entity":
        this.#updateEntity(data.entityId, data.data);
        break;
      case "add_material":
        this.#addMaterial(Material.fromJSON(data.material));
        break;
      case "remove_material":
        this.#removeMaterial(data.materialId);
        break;
      case "update_material":
        this.#updateMaterial(data.materialId, data.data);
        break;
    }
  };

  #addEntity(entity: Entity) {
    const previous = this.entities[entity.id];
    if (previous) this.#removeEntity(previous.id);

    // Set scene
    entity.scene = this;

    // Add to parent
    const parent = entity.parent;
    if (parent) {
      parent.childrenIds$.next([...parent.childrenIds$.value, entity.id]);
    }

    // Save to entities
    this.entities = {
      ...this.entities,
      [entity.id]: entity,
    };
  }

  #removeEntity(entityId: string) {
    const entity = this.entities[entityId];
    if (!entity) throw new Error(`Entity ${entityId} not found`);

    // Remove from parent
    if (entity.parent) {
      entity.parent.childrenIds$.next(
        entity.parent.childrenIds$.value.filter((id) => id !== entityId)
      );
    }

    // Destroy entity
    entity.destroy();

    // Remove from entities
    this.entities = Object.fromEntries(
      Object.entries(this.entities).filter(([id]) => id !== entityId)
    );
  }

  updateEntity(entityId: string, data: Partial<EntityJSON>) {
    this.#updateEntity(entityId, data);
    this.#toMainThread({
      subject: "update_entity",
      data: { entityId, data },
    });
  }

  #updateEntity(entityId: string, data: Partial<EntityJSON>) {
    const entity = this.entities[entityId];
    if (!entity) throw new Error(`Entity ${entityId} not found`);

    entity.applyJSON(data);
  }

  updateGlobalTransform(
    entityId: string,
    position: Triplet,
    quaternion: [number, number, number, number]
  ) {
    this.#updateGlobalTransform(entityId, position, quaternion);
    this.#toMainThread({
      subject: "update_global_transform",
      data: {
        entityId,
        position,
        quaternion,
      },
    });
  }

  #updateGlobalTransform(
    entityId: string,
    position: Triplet,
    quaternion: [number, number, number, number]
  ) {
    const entity = this.entities[entityId];
    entity.globalPosition = position;
    entity.globalQuaternion = quaternion;
  }

  #addMaterial(material: Material) {
    const previous = this.materials[material.id];
    if (previous) this.#removeMaterial(previous.id);

    // Save to materials
    this.materials = {
      ...this.materials,
      [material.id]: material,
    };
  }

  #removeMaterial(materialId: string) {
    const material = this.materials[materialId];
    if (!material) throw new Error(`Material ${materialId} not found`);

    // Remove from all entities
    this.entities = Object.fromEntries(
      Object.entries(this.entities).map(([id, entity]) => {
        if (entity.materialId === materialId) entity.materialId = null;
        return [id, entity];
      })
    );

    // Destroy material
    material.destroy();

    // Remove from materials
    this.materials = Object.fromEntries(
      Object.entries(this.materials).filter(([id]) => id !== materialId)
    );
  }

  #updateMaterial(materialId: string, data: Partial<Material>) {
    const material = this.materials[materialId];
    if (!material) throw new Error(`Material ${materialId} not found`);

    material.applyJSON(data);
  }

  destroy() {
    Object.values(this.entities).forEach((entity) => entity.destroy());
    Object.values(this.materials).forEach((material) => material.destroy());

    this.entities$.complete();
    this.materials$.complete();
  }
}
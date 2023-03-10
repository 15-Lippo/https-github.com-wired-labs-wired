import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { dedup, draco, prune, resample, simplify, textureResize } from "@gltf-transform/functions";
import { extensions } from "engine";
import { MeshoptSimplifier } from "meshoptimizer";

import createEncoderModule from "../../../public/scripts/draco_encoder";
import { env } from "../../env/server.mjs";
import { bytesToDisplay } from "../../utils/bytesToDisplay";
import { s3Client } from "./client";
import { expiresIn } from "./constants";

const ALL_EXCEPT_NODE = Object.values(PropertyType).filter((type) => type !== PropertyType.NODE);

export const PROJECT_FILE = {
  IMAGE: "image",
  MODEL: "model",
  OPTIMIZED_MODEL: "optimized_model",
} as const;

export type ProjectFile = (typeof PROJECT_FILE)[keyof typeof PROJECT_FILE];

export class Project {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  async getUpload(type: ProjectFile) {
    const Key = this.getKey(type);
    const ContentType = this.getContentType(type);
    const command = new PutObjectCommand({ Bucket: env.S3_BUCKET, Key, ContentType });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  }

  async getDownload(type: ProjectFile) {
    const Key = this.getKey(type);
    const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  }

  async delete() {
    const command = new DeleteObjectsCommand({
      Bucket: env.S3_BUCKET,
      Delete: {
        Objects: [
          { Key: this.getKey(PROJECT_FILE.IMAGE) },
          { Key: this.getKey(PROJECT_FILE.MODEL) },
        ],
      },
    });

    await s3Client.send(command);
  }

  async optimize() {
    // Fetch model from S3
    const modelKey = this.getKey(PROJECT_FILE.MODEL);
    const modelCommand = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: modelKey });
    const url = await getSignedUrl(s3Client, modelCommand, { expiresIn });
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const array = new Uint8Array(buffer);

    const start = performance.now();

    // Load model
    const io = new NodeIO()
      .registerExtensions(extensions)
      .registerDependencies({ "draco3d.encoder": await createEncoderModule() });

    const doc = await io.readBinary(array);

    // Process model
    try {
      // Some models fail with "Invalid JPG, marker table corrupted", not sure why
      // If it happens, catch the error and continue with the rest of the transforms
      await doc.transform(
        dedup(),
        prune({ propertyTypes: ALL_EXCEPT_NODE }),
        textureResize({ size: [4096, 4096] })
      );
    } catch (err) {
      console.warn("Transform failed:", err);
    }

    await doc.transform(
      resample(),
      simplify({ simplifier: MeshoptSimplifier, ratio: 0.75, error: 0.001 }),
      draco({ method: "edgebreaker", encodeSpeed: 1, decodeSpeed: 5 })
    );

    // Write model
    const optimizedArray = await io.writeBinary(doc);

    console.info(
      "?????? Optimized model:",
      bytesToDisplay(array.byteLength),
      "->",
      bytesToDisplay(optimizedArray.byteLength),
      `(${Math.round((optimizedArray.byteLength / array.byteLength) * 100)}%)`,
      `(${Math.round(performance.now() - start)}ms)`
    );

    // Upload model to S3
    const optimizedKey = this.getKey(PROJECT_FILE.OPTIMIZED_MODEL);
    const optimizedCommand = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: optimizedKey,
      Body: optimizedArray,
      ContentType: this.getContentType(PROJECT_FILE.OPTIMIZED_MODEL),
    });

    await s3Client.send(optimizedCommand);
  }

  getKey(type: ProjectFile) {
    switch (type) {
      case PROJECT_FILE.IMAGE: {
        return `projects/${this.id}/image.jpg`;
      }

      case PROJECT_FILE.MODEL: {
        return `projects/${this.id}/model.glb`;
      }

      case PROJECT_FILE.OPTIMIZED_MODEL: {
        return `projects/${this.id}/optimized_model.glb`;
      }
    }
  }

  getContentType(type: ProjectFile) {
    switch (type) {
      case PROJECT_FILE.IMAGE: {
        return "image/jpeg";
      }

      case PROJECT_FILE.MODEL:
      case PROJECT_FILE.OPTIMIZED_MODEL: {
        return "model/gltf-binary";
      }
    }
  }
}

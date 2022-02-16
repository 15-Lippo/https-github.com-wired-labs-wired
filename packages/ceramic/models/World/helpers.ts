import { TileLoader } from "@glazed/tile-loader";
import { World } from "./types";

const model = require("./model.json");

export async function newWorld(world: World, loader: TileLoader) {
  const stream = await loader.create(
    world,
    { schema: model.schemas.World },
    { pin: true }
  );
  const streamId = stream.id.toString();
  return streamId;
}
import { NodeJSON } from "../../../scene";
import { PostMessage } from "../../../types";
import { FromRenderMessage } from "../../types";
import { SceneMap } from "../types";
import { updateNode } from "./updateNode";

export function addNode(
  node: NodeJSON,
  map: SceneMap,
  postMessage: PostMessage<FromRenderMessage>
) {
  map.nodes.set(node.id, node);
  updateNode(node.id, node, map, postMessage);
}
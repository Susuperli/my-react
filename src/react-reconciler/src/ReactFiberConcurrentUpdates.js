import { HostRoot } from './ReactWorkTags';

export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber; // 当前fiber
  let parent = sourceFiber.return; // 当前fiber的父fiber

  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }

  // 一直找到parent为null
  if ((node.tag = HostRoot)) {
    return node.stateNode;
  }

  return null;
}

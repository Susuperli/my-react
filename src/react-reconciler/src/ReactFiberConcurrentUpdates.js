import { HostRoot } from './ReactWorkTags';

const concurrentQueue = [];
let concurrentQueueIndex = 0;

/**
 * 把更新先缓存到concurrentQueue数组中
 * @param {*} fiber
 * @param {*} queue
 * @param {*} update
 */
function enqueueUpdate(fiber, queue, update) {
  concurrentQueue[concurrentQueueIndex++] = fiber; // 函数组件对应的fiber
  concurrentQueue[concurrentQueueIndex++] = queue; // 要更新的hook对应的更新队列
  concurrentQueue[concurrentQueueIndex++] = update; // 更新对象
}

/**
 * 完成hook的队列更新
 */
export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueueIndex; // 边界条件
  concurrentQueueIndex = 0; // 重置concurrentQueueIndex

  let i = 0;
  while (i < endIndex) {
    const fiber = concurrentQueue[i++];
    const queue = concurrentQueue[i++];
    const update = concurrentQueue[i++];

    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }

      queue.pending = update;
    }
  }
}

/**
 * 把更新添加到更新队列中
 * @param {*} fiber
 * @param {*} queue
 * @param {*} update
 * @returns
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update);

  return getRootForUpdateFiber(fiber);
}
function getRootForUpdateFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  return node.tag === HostRoot ? node.stateNode : null; // FiberRootNode div#root
}

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

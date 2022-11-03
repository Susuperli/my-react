import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates';
import assign from 'shared/assign';

export const UpdateState = 0; // 更新标记

export function initialUpdateQueue(fiber) {
  // 创建一个更新队列
  // pending其实是一个循环链表
  const queue = {
    shared: {
      pending: null,
    },
  };

  fiber.updateQueue = queue;
}

export function createUpdate() {
  const update = { tag: UpdateState };

  return update;
}

export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  const pending = updateQueue.shared.pending;

  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }

  // pending要指向最后一个更新，最后一个更新 next指向第一个更新
  // 单向循环链表
  updateQueue.shared.pending = update;

  return markUpdateLaneFromFiberToRoot(fiber); // 返回根fiber
}

/**
 * 根据老状态和更新队列中的更新计算最新的状态
 * @param {*} workInProcess 要计算的fiber
 */
export function processUpdateQueue(workInProcess) {
  // 取出更新队列
  const queue = workInProcess.updateQueue;
  // 这里要知道更新队列的结构，pending是一个循环列表，shared.pending指向的是最后一个挂载的更新
  const pendingQueue = queue.shared.pending;

  // 如果有更新，或者说更新队列有内容
  if (pendingQueue !== null) {
    // 清楚更新队列，防止之后重复更新
    queue.shared.pending = null;
    // 获取更新队列中的最后一个更新 update = { payload: { element: 'h1'}}
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next;
    // 断开更新链表，变成一个单链表 方便更新
    lastPendingUpdate.next = null;

    // 读取老的状态 null
    let newState = workInProcess.memoizedState;
    let update = firstPendingUpdate;

    while (update) {
      // 根据老状态和更新计算新的状态
      newState = getStateFromUpdate(update, newState);

      update = update.next;
    }

    // 把最终的计算的状态赋值给memoizedState
    workInProcess.memoizedState = newState;
  }
}

/**
 * 合并更新，这里要合并的是更新队列和memoizedState上面的更新
 * @param {*} update 更新队列
 * @param {*} prevState memoizedState
 * @returns
 */
function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState: {
      const { payload } = update;
      return assign({}, prevState, payload);
    }
  }
}

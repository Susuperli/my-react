import { enqueueUpdate, createUpdate } from './ReactFiberClassUpdateQueue';
import { createFiberRoot } from './ReactFiberRoot';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

/**
 * 更新容器，把虚拟dom element变成真实DOM插入到container容器中
 * @param {*} element 虚拟DOM
 * @param {*} container DOM容器 FiberRootNode containerInfo div#root
 */
export function updateContainer(element, container) {
  // 获取当前的根fiber
  const current = container.current;
  // 创建更新
  const update = createUpdate();
  // 要更新的虚拟DOM
  update.payload = { element };
  // 把此更新对象添加到这个current这个根fiber上面
  const root = enqueueUpdate(current, update);

  scheduleUpdateOnFiber(root);
}

import { enqueueUpdate, createUpdate } from './ReactFiberClassUpdateQueue';
import { createFiberRoot } from './ReactFiberRoot';
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}
export function updateContainer(element, container) {
  // 获取当前的根fiber
  const current = container.current;
  // 创建更新
  const update = createUpdate();
  // 要更新的虚拟DOM
  update.payload = { element };
  // 把此更新对象添加到这个current这个根fiber上面
  enqueueUpdate(current, update);
}

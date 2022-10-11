import { createHostRootFiber } from './ReactFiber';
import { initialUpdateQueue } from './ReactFiberClassUpdateQueue';

// 过程可能比较绕，但是就是FiberRootNode就是一个真实的root节点
function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo; // div#root
}

export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo);

  // HostRoot指的就是根节点div#root，uninitializedFiber就是根fiber
  const uninitializedFiber = createHostRootFiber();
  // 根容器的current指向当前根fiber
  root.current = uninitializedFiber;
  // 根fiber的stateNode，也就是真实DOM节点指向FiberRootNode
  uninitializedFiber.stateNode = root;

  initialUpdateQueue(uninitializedFiber);

  return root;
}

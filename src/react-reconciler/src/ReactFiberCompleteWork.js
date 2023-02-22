import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from './ReactWorkTags';
import {
  createTextInstance,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
  prepareUpdate,
} from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { NoFlags, Update } from './ReactFiberFlags';

/**
 * 把当前完成的fiber的所有子节点对应的真实dom都挂载到自己父parent真实dom上面
 * @param {*} parent 当前完成fiber的真是节点
 * @param {*} workInProcess 当前fiber
 */
function appendAllChildren(parent, workInProcess) {
  // 这里的挂载不是简单的appendClild，要排除函数组件或者是类组件的影响，因为他们并没有真正的真实节点
  let node = workInProcess.child;

  while (node) {
    if (node.tag === HostComponent || node.tag === HostText) {
      // 如果这里是原生组件，或是文本节点 便可放心插入
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 其它的不可直接插入的情况
      node = node.child;
      // 这里不能return，还需要继续遍历sibling fiber
      continue;
    }

    if (node === workInProcess) {
      // 这里指的是该fiber不是一个可以直接插入的组件，且没有子节点，结束循环即可
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === workInProcess) {
        return;
      }
      // 回到父节点
      node = node.return;
    }

    // 这里是深度优先的遍历，有儿子先遍历儿子，没有儿子找兄弟，都没有就返回父节点，继续找兄弟，直到回到workInProcess本身，停止其遍历。
    node = node.sibling;
  }
}

function markUpdate(workInProcess) {
  workInProcess.flags |= Update; // 给当前的fiber添加新的副作用
}
/**
 * 在fiber的完成阶段准备更新DOM
 * @param {*} current 老fiber
 * @param {*} workInProcess 新fiber
 * @param {*} type 类型
 * @param {*} newProps 新属性
 */
function updateHostComponent(current, workInProcess, type, newProps) {
  const oldProps = current.memoizedProps; // 老的属性
  const instance = workInProcess.stateNode; // 老的DOM节点
  // 比较新老属性，收集属性的差异
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
  // 让原生组件的新fiber更新队列等于[]
  workInProcess.updateQueue = updatePayload;

  if (updatePayload) {
    markUpdate(workInProcess);
  }
}

/**
 * 完成一个节点，这里需要做的就是根据fiber创建真实dom节点，冒泡节点属性
 * @param {*} current
 * @param {*} workInProgress
 */
export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostRoot:
      bubbleProperties(workInProgress);
      break;
    case HostComponent:
      // 如果是原生节点
      // 创建真实的dom节点
      const { type } = workInProgress;
      // 如果老fiber存在，并且老fiber上存在真实DOM节点，要走节点更新的逻辑
      if (current !== null && workInProgress.stateNode !== null) {
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        const instance = createInstance(type, newProps, workInProgress);
        // 把所有儿子都添加在自己身上
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
        // 挂载初始属性
        finalizeInitialChildren(instance, type, newProps);
      }

      // 冒泡属性
      bubbleProperties(workInProgress);
      break;
    case FunctionComponent:
      bubbleProperties(workInProgress);
      break;
    case HostText:
      // 如果是文本节点，那就创建真实的文本节点
      const newText = newProps;
      // 创建真实节点并传入stateNode
      workInProgress.stateNode = createTextInstance(newText);
      // 向上冒泡属性
      bubbleProperties(workInProgress);
      break;

    default:
      break;
  }
}

/**
 * 将当前fiber的所有子节点，以及子节点的儿子的副作用都挂在fiber上面
 * @param {*} completedWork
 */
function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags;
  let child = completedWork.child;

  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }

  completedWork.subtreeFlags = subtreeFlags;
}

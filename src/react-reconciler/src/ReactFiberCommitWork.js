import {
  MutationMask,
  Placement,
  Update,
  Passive,
  LayoutMask,
} from './ReactFiberFlags';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from './ReactWorkTags';
import {
  insertBefore,
  appendChild,
  commitUpdate,
  removeChild,
} from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout,
} from './ReactHookEffectTags';

let hostParent = null;

/**
 * 提交删除副作用
 * @param {*} root 根节点
 * @param {*} returnFiber 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
  let parent = returnFiber;

  // 一直向上找，找到真实的DOM节点为此
  findParent: while (parent !== null) {
    switch (parent.tag) {
      case HostComponent: {
        hostParent = parent.stateNode;
        break findParent;
      }

      case HostRoot: {
        hostParent = parent.stateNode.containerInfo;
        break findParent;
      }
    }

    parent = parent.return;
  }

  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
  hostParent = null;
}

function commitDeletionEffectsOnFiber(
  finishedRoot,
  nearestMountedAncestor,
  deletedFiber,
) {
  switch (deletedFiber.tag) {
    case HostComponent:
    case HostText: {
      // 当要删除一个节点的时候，要先删除它的子节点
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber,
      );
      // 再把自己删除
      if (hostParent !== null) {
        removeChild(hostParent, deletedFiber.stateNode);
      }

      break;
    }
    default:
      break;
  }
}
function recursivelyTraverseDeletionEffects(
  finishedRoot,
  nearestMountedAncestor,
  parent,
) {
  let child = parent.child;
  while (child !== null) {
    commitDeletionEffectsOnFiber(
      finishedRoot,
      nearestMountedAncestor,
      deletedFiber,
    );
    child = child.sibling;
  }
}

/**
 * 递归遍历有变动的副作用节点
 * @param {*} root
 * @param {*} finishedWork
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  // 先把父fiber上该删除的节点都删除
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      commitDeletionEffects(root, parentFiber, childToDelete);
    }
  }

  if (parentFiber.subtreeFlags & MutationMask) {
    // 这里其实什么都没有做，就是遍历，处理操作之后会补出来
    // 如果传入的节点子节点有副作用
    let { child } = parentFiber;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}

/**
 * 处理自己身上的副作用
 * @param {*} finishedWork
 */
function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork;

  if (flags & Placement) {
    // 如果此fiber要执行插入操作
    // 把此fiber对应的真实dom节点添加到父真实dom上面
    commitPlacement(finishedWork);
    // 删除flags里的Plcement
    finishedWork.flags & ~Placement;
  }
}

/**
 * 把对应的子节点真实dom插入到父节点中
 * @param {*} node 将要被处理的fiber节点
 * @param {*} before 真实的弟弟真实dom
 * @param {*} parent 真实的父dom
 *
 * 这里单单通过parent是无法正确的添加子节点，还需要一个弟弟dom来确定位置，比如parent有两个子节点，我需要在两人之间插入新的节点appendChild显然是做不到的
 */
function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node;
  // 判断此fiber对应的节点是不是真实dom节点
  const isHost = tag === HostComponent || tag === HostText;

  // 如果是的话就直接插入
  if (isHost) {
    const { stateNode } = node;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    // 如果node不是真实DOM节点，获取它的大儿子
    const { child } = node;

    if (child !== null) {
      // 把大儿子添加到父节点DOM中
      insertOrAppendPlacementNode(child, before, parent);

      let { sibling } = child;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

/**
 * 把此fiber的真实dom插入到父dom中去
 * @param {*} finishedWork 完成的工作
 */
function commitPlacement(finishedWork) {
  // 获取最近的，可以插入dom的 父fiber
  const parentFiber = getHostParentFiber(finishedWork);

  switch (parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo;
      // 获取最近的弟弟真实dom节点
      const before = getHostSibling(finishedWork);

      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    case HostComponent: {
      const parent = parentFiber.stateNode;
      const before = getHostSibling(finishedWork);

      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    default:
      break;
  }
}

/**
 * 提交在fiber上面的副作用
 * @param {*} finishedWork 完成的工作，HostRootFiber
 * @param {*} root FiberRootNode
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  switch (finishedWork.tag) {
    case FunctionComponent: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      if (flags & Update) {
        commitHookEffectListUnmount(HookHasEffect | HookLayout, finishedWork);
      }
      break;
    }
    case HostRoot:
    case HostText: {
      // 先遍历他们的子节点，处理他们身上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    case HostComponent: {
      // 先遍历他们的子节点，处理他们身上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      // 处理DOM更新
      if (flags & Update) {
        // 获取真实DOM
        const instance = finishedWork.stateNode;
        // 更新真实DOM
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps;
          const oldProps = current !== null ? current.memoizedProps : newProps;
          const type = finishedWork.type;
          const updatePayload = finishedWork.updateQueue;
          finishedWork.updateQueue = null;

          if (updatePayload) {
            commitUpdate(
              instance,
              updatePayload,
              type,
              oldProps,
              newProps,
              finishedWork,
            );
          }
        }
      }
      break;
    }
    default:
      break;
  }
}

/**
 * 找到最近的可以插入的fiber
 * @param {*} fiber
 * @returns
 */
function getHostParentFiber(fiber) {
  let parent = fiber.return;

  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }

    parent = parent.return;
  }
}
/**
 * 找到想要的锚点，根据弟弟dom来插入节点
 * @param {*} fiber
 */
function getHostSibling(fiber) {
  let node = fiber;

  siblings: while (true) {
    while (node.sibling === null) {
      // 如果没有弟弟节点
      if (node.return === null || isHostParent(node.return)) {
        // 如果没有父节点，或者是可以
        return null;
      }
      node = node.return;
    }

    // 如果弟弟节点存在存在
    node = node.sibling;
    while (node.tag !== HostComponent && node.tag !== HostText) {
      // 如果不是原生节点，或者是文本节点，这些真实节点就继续遍历
      if (node.flags & Placement) {
        // 如果也是插入的fiber就不用继续遍历了 直接返回第一层找下一个弟弟
        continue siblings;
      } else {
        node = node.child;
      }
    }

    // 如果不是插入 就直接返回stateNode
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}

/**
 * 判断该fiber是否是可以插入的fiber，根fiber或者原生节点的fiber
 * @param {*} fiber
 * @returns
 */
function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork);
}
function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    }

    // 只有函数组件才会有useeffect
    case FunctionComponent: {
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      if (flags & Passive) {
        // 1024
        commitHookPassiveUnmountEffects(
          finishedWork,
          HookHasEffect | HookPassive,
        );
      }
      break;
    }
  }
}

function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveUnmountOnFiber(child);
      child = child.sibling;
    }
  }
}
function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork);
}
function commitHookEffectListUnmount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    // 获取第一个effect
    const firstEffect = lastEffect.next;
    let effect = firstEffect;

    do {
      // 如果此effect类型和传入的相同，都是9 HookHasEffect | Passiveeffect
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy;
        if (destroy !== undefined) {
          destroy();
        }
      }

      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork);
}
function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      break;
    }

    // 只有函数组件才会有useeffect
    case FunctionComponent: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      if (flags & Passive) {
        // 1024
        commitHookPassiveMountEffects(
          finishedWork,
          HookHasEffect | HookPassive,
        );
      }
      break;
    }
  }
}

function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveMountOnFiber(root, child);
      child = child.sibling;
    }
  }
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}
function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    // 获取第一个effect
    const firstEffect = lastEffect.next;
    let effect = firstEffect;

    do {
      // 如果此effect类型和传入的相同，都是9 HookHasEffect | Passiveeffect
      if ((effect.tag & flags) === flags) {
        const create = effect.create;
        effect.destroy = create();
      }

      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

export function commitLayoutEffects(finishedWork, root) {
  //老的根fiber
  const current = finishedWork.alternate;
  commitLayoutEffectOnFiber(root, current, finishedWork);
}
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    }
    case FunctionComponent: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & LayoutMask) {
        // LayoutMask=Update=4
        commitHookLayoutEffects(finishedWork, HookHasEffect | HookLayout);
      }
      break;
    }
  }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}
function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & LayoutMask) {
    let child = parentFiber.child;
    while (child !== null) {
      const current = child.alternate;
      commitLayoutEffectOnFiber(root, current, child);
      child = child.sibling;
    }
  }
}

import {
  scheduleCallback,
  NormalPriority as NormalSchedulerPriority,
  shouldYield,
} from 'scheduler';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import {
  NoFlags,
  MutationMask,
  Placement,
  Update,
  ChildDeletion,
  Passive,
} from './ReactFiberFlags';
import {
  commitMutationEffectsOnFiber, // 执行DOM操作
  commitPassiveUnmountEffects, // 执行destroy
  commitPassiveMountEffects, // 执行create
  commitLayoutEffects,
} from './ReactFiberCommitWork';
import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from './ReactWorkTags';
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates';

let workInProgress = null; // 当前正在处理的fiber
let workInProgressRoot = null;
let rootDoesHavePassiveEffect = false; // 此根节点上有没有useEffect类似的副作用
let rootWithPendingPassiveEffects = null; // 具有useEffect副作用的根节点FiberRootNode, 根fiber.stateNode

/**
 * 计划更新root
 * 源码此处有一个任务的功能
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root) {
  //确保调度执行root上的更新
  ensureRootIsScheduled(root);
}
function ensureRootIsScheduled(root) {
  if (workInProgressRoot) return;
  workInProgressRoot = root;
  // 告诉浏览器要执行performConcurrentWorkOnRoot
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

/**
 * 根据fiber构建fiber树，要创建真实的DOM节点，还需要把真实DOM节点插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root, timeout) {
  // 第一次渲染以同步的方式渲染根节点，初次渲染的时候，都是同步
  renderRootSync(root);

  // 开始进入提交阶段，执行副作用，修改真实dom
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;

  commitRoot(root);
  workInProgressRoot = null;
}

function flushPassiveEffect() {
  console.log('下一个宏任务中flushPassiveEffect~~~~~~~~~~');
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    // 执行卸载副作用， destroy

    commitPassiveUnmountEffects(root.current);
    // 执行挂载副作用 create

    commitPassiveMountEffects(root, root.current);
  }
}
/**
 * 提交节点
 * @param {*} root
 */
function commitRoot(root) {
  // 先获取新的构建好的fiber树的根fiber tag=3
  const { finishedWork } = root;

  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true;
      scheduleCallback(NormalSchedulerPriority, flushPassiveEffect);
    }
  }

  console.log('开始commit~~~~~~~~~~~~~~~~~~~~~~~');
  // 判断子节点和自己身上有没有副作用
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
  // 如果自己的副作用或者子节点有副作用就进行DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    // 当DOM执行变更之后
    console.log('DDOM执行变更commitMutationEffectsOnFiber~~~~~~~~~~~~~~');

    commitMutationEffectsOnFiber(finishedWork, root);

    // 执行layout Effect
    console.log(
      'DOM执行变更后commitLayoutEffects~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    );
    commitLayoutEffects(finishedWork, root);
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false;
      rootWithPendingPassiveEffects = root;
    }
  }
  // 等DOM变更之后，更改root中current的指向
  root.current = finishedWork;
}
function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null);

  finishQueueingConcurrentUpdates();
}
function renderRootSync(root) {
  // 开始构建fiber树，主要的作用就是根据root来创建一个可以用来轮替的fiber树
  prepareFreshStack(root);

  // 循环更新fiber
  workLoopSync();
}
function workLoopConcurrent() {
  // 如果有下一个需要构建的fiber且时间片没有过期
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
function workLoopSync() {
  // 只要是workInProgress存在就会一直处理这个fiber，处理完一个fiber workInProgress就会变成它的子fiber或者是sibling
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
/**
 * 执行工作单元
 * @param {*} unitOfWork 将要处理的fiber
 */
function performUnitOfWork(unitOfWork) {
  // 获取新的fiber对应的老fiber，这是值是可能为null的。
  const current = unitOfWork.alternate;

  // beginWork的作用其实就是分发函数，通过fiber不同的tag来分发给不同的函数来处理，返回值是下一个要处理的fiber，多数为子fiber，对fiber树进行深度遍历
  const next = beginWork(current, unitOfWork);

  // 将要生效的属性就变成了生效的属性
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // 如果没有子节点表示当前fiber已经完成工作
    completeUnitOfWork(unitOfWork);
  } else {
    // 如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next;
  }
}

/**
 * 完成单个fiber，这里要做主要是创建真实节点和让workInProgress指向sibling或者return，对fiber树进行广度的遍历
 * @param {*} unitOfWork
 */
function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;

  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    // 执行此fiber的玩成工作，如果是原生组件的就是创建真实节点
    completeWork(current, completedWork);
    // 如果有弟弟，就对弟弟进行fiber链表的构建
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;

      return;
    }
    //如果没有弟弟，需要做两件事：
    // 1. 这个节点的父节点已经全部完成，标记其完成
    // 2. 将workInProgress指向这个节点的父节点，看看他是否还有sibling节点需要遍历
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}

function printFinishedWork(fiber) {
  const { flags, deletions } = fiber;
  if ((flags & ChildDeletion) !== NoFlags) {
    fiber.flags &= ~ChildDeletion;
    console.log(
      '子节点有删除' +
        deletions
          .map((fiber) => `${fiber.type}#${fiber.memoizedProps.id}`)
          .join(','),
    );
  }
  let child = fiber.child;
  while (child) {
    printFinishedWork(child);
    child = child.sibling;
  }

  if (fiber.flags !== NoFlags) {
    console.log(
      getFlags(fiber),
      getTag(fiber.tag),
      typeof fiber.type === 'function' ? fiber.type.name : fiber.type,
      fiber.memoizedProps,
    );
  }
}
function getFlags(fiber) {
  const { flags } = fiber;
  if (flags === (Placement | Update)) {
    return '移动';
  }
  if (flags === Placement) {
    return '插入';
  }
  if (flags === Update) {
    return '更新';
  }

  return flags;
}
function getTag(tag) {
  switch (tag) {
    case FunctionComponent:
      return 'FunctionComponent';
    case HostRoot:
      return 'HostRoot';
    case HostComponent:
      return 'HostComponent';
    case HostText:
      return 'HostText';
    default:
      return tag;
  }
}

// workLoop主要是通过beginWork和completeUnitOfWork来分别对fiber树进行深度和广度的遍历

import {
  HostComponent,
  HostRoot,
  HostText,
  IndeterminateComponent,
} from './ReactWorkTags';
import { NoFlags } from './ReactFiberFlags';

/**
 * 创建Fiber节点
 * @param {*} tag fiber的类型 函数组件0 类组件1 根元素3 原生组件5
 * @param {*} pendingProps 新属性，等待处理或者说生效的属性
 * @param {*} key 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.key = key;
  this.type = null; // fiber类型，来自于 虚拟DOM节点的type(span div p)
  // 每个虚拟DOM=>Fiber节点=>真实DOM
  this.stateNode = null; // 此fiber对应的真实DOM节点 h1 => 真实的h1DOM

  this.return = null; // 指向父节点
  this.child = null; // 指向第一个子节点
  this.sibling = null; // 指向弟弟

  // fiber哪里来的？通过虚拟DOM节点创建，虚拟DOM会提供pendingProps用来创建fiber节点的属性
  this.pendingProps = pendingProps; // 等待生效的属性
  this.memoizedProps = null; // 已经生效的属性

  // 每个fiber还会有自己的状态，每一种fiber 状态存的类型是不一样的
  // 类组件对应的fiber 存的就是类的实例状态，HostRoot存的就是要渲染的元素
  this.memoizedState = null;
  // 每个fiber身上可能还有更新队列
  this.updateQueue = null;
  // 副作用的标识，表示要针对此fiber节点急性何种操作
  this.flags = NoFlags; // 自己的副作用
  // 子节点对用的副使用标识
  this.subtreeFlags = NoFlags;
  // 替身，轮替 DOM-DIFF时会用到
  this.alternate = null;
  this.index = 0;

  this.deletions = null; // 子节点是否有需要被删除
}
// We use a double buffering pooling technique because we know that we'll only ever need at most two versions of a tree.
// We pool the "other" unused  node that we're free to reuse.

// This is lazily created to avoid allocating
// extra objects for things that are never updated. It also allow us to
// reclaim the extra memory if needed.
/**
 * 创建fiber节点
 * @param {*} tag fiber的类型 函数组件0 类组件1 根元素3 原生组件5
 * @param {*} pendingProps 新属性，等待处理或者说生效的属性
 * @param {*} key 唯一标识
 * @returns
 */
export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

/**
 * 基于老的fiber和新的属性创建新的fiber
 * 1. current和workInProgress不是一个对象
 * 2. workInProgress
 *   2.1 有两种情况，一种是没有，创建一个新的，相互通过alternate指向
 *   2.2 存在alternate，直接服用老的alternate就可以了
 * 复用有两层含义
 * 1. 复用老的fiber对象
 * 2. 复用老的真实DOM
 * @param {*} current 老fiber
 * @param {*} pendingProps 新属性
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // 新建轮替
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 更新轮替
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }
  // 复用老的属性
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}

/**
 * 根据虚拟dom创建fiber节点
 * @param {*} element 虚拟节点
 */
export function createFiberFromElement(element) {
  const { type, key, props: pendingProps } = element;

  return createFiberFromTypeAndProps(type, key, pendingProps);
}

function createFiberFromTypeAndProps(type, key, pendingProps) {
  let tag = IndeterminateComponent; // 这里给一默认的tag，未确定的组件

  // 如果type是一个string，比如div span此类，说明是一个原生的组件
  if (typeof type === 'string') {
    tag = HostComponent;
  }

  const fiber = createFiber(tag, pendingProps, key);
  fiber.type = type;

  return fiber;
}

export function createFiberFromText(content) {
  return createFiber(HostText, content, null);
}

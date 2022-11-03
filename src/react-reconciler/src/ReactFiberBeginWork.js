import logger, { indent } from 'shared/logger';
import { HostRoot, HostComponent, HostText } from './ReactWorkTags';
import { processUpdateQueue } from './ReactFiberClassUpdateQueue';
import { mountChildFibers, reconcileChildFibers } from './ReactChildFiber';
import { shouldSetTextContent } from 'react-dom-bindings/src/ReactDOMHostConfig';

/**
 * 根据新的虚拟Dom生成新的fiber链表
 * @param {*} current 老的父fiber
 * @param {*} workInProgress 新的父fiber
 * @param {*} nextChildren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  // 如果此新fiber没有老fiber，说明此新fiber是新创建的
  if (current == null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 如果说有老fiber的话，做DOM-DIFF 拿老的子fiber链表和新的虚拟DOM进行比较，进行最小话的更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
    );
  }
}

/**
 * 更新根节点，把child子fiber加到根节点上面
 * @param {*} current 当前节点
 * @param {*} workInProgress 正在处理的节点
 * @returns
 */
function updateHostRoot(current, workInProgress) {
  // 需要知道它的子虚拟DOM，知道它的儿子的虚拟DOM信息
  processUpdateQueue(workInProgress);
  // 经过processUpdateQueue计算之后，memoizedState就会挂载最新的更新
  const nextState = workInProgress.memoizedState; // workInProcess.memoizedState = { element }

  // nextChildren就是新的子虚拟DOM
  const nextChildren = nextState.element; // h1
  // 根据新的虚拟DOM生成子fiber链表
  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child; // { tag: 5, type: 'h1'}
}

/**
 * 构建原生的子fiber链表
 * @param {*} current 老fiber
 * @param {*} workInProgress 正在工作的fiber
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  const nextProps = workInProgress.pendingProps;

  let nextChildren = nextProps.children;
  // 判断当前虚拟dom它的儿子是不是一个文本独生子，因为独生子是不需要单独创建fiber的
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }

  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child;
}

/**
 * 目标是根据虚拟dom构建新的fiber链表，其实就是分发函数，通过fiber不同的tag来分发给不同的函数来处理
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @returns 子节点fiber
 */
export function beginWork(current, workInProgress) {
  logger(' '.repeat(indent.number) + 'beginWork', workInProgress);
  indent.number += 2;
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return null;
    default:
      return null;
  }
}

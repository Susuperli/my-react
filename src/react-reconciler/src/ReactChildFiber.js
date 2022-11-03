import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { createFiberFromElement, createFiberFromText } from './ReactFiber';
import { Placement } from './ReactFiberFlags';
import isArray from 'shared/isArray';

/**
 *
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  function reconcileSingleElement(returnFiber, currentFirstFiber, element) {
    // 因为我们现实的初次挂载，老节点currentFirstFiber肯定是没有的，所以可以直接根据虚拟DOM 这里也会有dom-diff
    const created = createFiberFromElement(element);
    created.return = returnFiber;

    return created;
  }

  /**
   * 根据不同的虚拟dom创建新fiber，这里依旧是有两种情况，分别是单独一个文本节点string or number，或者是一个其它节点是一个对象
   * @param {*} returnFiber
   * @param {*} mewChild
   */
  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const created = createFiberFromText(newChild);
      created.return = returnFiber;

      return created;
    }

    // 这里指的是除了文本节点之外的节点
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }

        default:
          break;
      }
    }

    return null;
  }

  /**
   * 这里的作用是判断是否添加副作用
   * @param {*} newFiber 新创建的fiber
   */
  function placeSingleChild(newFiber) {
    if (shouldTrackSideEffects) {
      newFiber.flages |= Placement;
    }

    return newFiber;
  }
  /**
   * 这里的作用是判断是否添加副作用和添加一个index
   * @param {*} newFiber 新fiber
   * @param {*} newIdx 序号
   */
  function placeChild(newFiber, newIdx) {
    newFiber.index = newIdx;

    if (shouldTrackSideEffects) {
      //如果一个fiber它的flags上有Placement,说明此节点需要创建真实DOM并且插入到父容器中
      //如果父fiber节点是初次挂载，shouldTrackSideEffects=false,不需要添加flags 这种情况下会在完成阶段把所有的子节点全部添加到自己身上
      newFiber.flages |= Placement;
    }
  }

  function reconcileChildrenArray(returnFiber, currentFirstFiber, newChildren) {
    let resultingFirstChild = null; // 返回的第一个儿子
    let previousNewFiber = null; // 上一个的一个新fiber
    let newIdx = 0; // 给新创建fiber拍一个序
    for (; newIdx < newChildren.length; newIdx++) {
      // 创建新fiber
      const newFiber = createChild(returnFiber, newChildren[newIdx]);

      if (newFiber === null) continue;

      // 添加属性，挂载副作用
      placeChild(newFiber, newIdx);

      // 如果previousNewFiber为null，说明是第一个fiber
      if (previousNewFiber === null) {
        // 我们为什么这么特殊关注是否为第一个儿子？
        // 事实上这跟fiber的结构有关，在联系父子fiber时，我们的父fiber只关注第一个儿子即child只是指向第一个子fiber，这样的结构有助于我们进行深度优先的遍历。
        resultingFirstChild = newFiber;
      } else {
        // 否则说明不是第一个儿子，那就把这个newFiber添加在上一个子节点后面
        previousNewFiber.sibling = newFiber;
      }

      //让newFiber成为最后一个或者说上一个子fiber
      previousNewFiber = newFiber;
    }

    return resultingFirstChild;
  }

  /**
   * 比较子fiber dom-diff就是用老的子fiber链表和新的虚拟dom进行比较的过程，这里的究极目的就是两个，dom-diff和创建fiber
   * @param {*} returnFiber 新的父fiber，这里知识保证return的指向
   * @param {*} currentFirstFiber 老fiber的第一个子fiber，用来和新的虚拟dom进行比较
   * @param {*} newChild 新的子虚拟dom，这里可能是一个单节点（对象），多节点（数组）
   */
  function reconcileChildFibers(returnFiber, currentFirstFiber, newChild) {
    // 现在暂时值考虑新节点只有一个的情况
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstFiber, newChild),
          );
        default:
          break;
      }
    }

    // newChild存在多节点情况，此时为一个数组
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstFiber, newChild);
    }

    // 兜底返回null，这里指的是单独的文本节点情况，他们不需要fiber
    return null;
  }

  return reconcileChildFibers;
}

// 有老的父fiber更新的时候就用这个
export const reconcileChildFibers = createChildReconciler(true);
// 如果没有老父fiber，初次挂载的时候就用这个
export const mountChildFibers = createChildReconciler(false);

import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from './ReactFiber';
import { ChildDeletion, Placement } from './ReactFiberFlags';
import isArray from 'shared/isArray';

/**
 *
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   * 创建一个新的fiber，这个fiber可以复用之前的alternate
   * @param {*} fiber
   * @param {*} pendingProps
   * @returns
   */
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      return;
    }

    const deletions = returnFiber.deletions;
    if (deletions === null) {
      // 添加删除数组
      returnFiber.deletions = [childToDelete];
      // 添加删除flags
      returnFiber.flags |= ChildDeletion;
    } else {
      returnFiber.deletions.push(childToDelete);
    }
  }
  // 删除从currentFirstChild之后的所有fiber节点
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return;

    let childToDelete = currentFirstChild;

    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }

    return null;
  }
  /**
   * 处理单元素节点
   * @param {*} returnFiber 父fiber div#root对应的fiber
   * @param {*} currentFiberChild 老的FunctionComponent对应的fiber
   * @param {*} element 新的虚拟DOM对象
   * @returns 返回第一个子fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    // 新的虚拟DOM的key，也就是唯一标识
    const key = element.key; // 没写就是null
    let child = currentFirstChild; // 老的FunctionComponent对应的fiber
    while (child !== null) {
      // 判断此老fiber对应的key和新的虚拟DOM对象的key是否一样 null === null
      if (child.key === key) {
        // 判断此老fiber对应的类型和新的虚拟DOM元素对应的类型是否相同
        if (child.type === element.type) {
          // 删除剩余的其他子节点
          deleteRemainingChildren(returnFiber, child.sibling);
          // 如果key一样，类型也一样，则认为此节点可以复用
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          // key相同，但是类型不同 比如 p div，那么这个老fiber是不能被复用的，那就删除
          deleteRemainingChildren(returnFiber, child);
        }
      } else {
        // 如果key不相同那就直接删除
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }
    // 因为我们现实的初次挂载，老节点currentFirstChild肯定是没有的，所以可以直接根据虚拟DOM 这里也会有dom-diff
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
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }

    return newFiber;
  }
  /**
   * 这里的作用是判断是否添加副作用和添加一个index
   * @param {*} newFiber 新fiber
   * @param {*} newIdx 序号
   */
  function placeChild(newFiber, newIdx) {
    // 指定新的fiber在新的挂载索引
    newFiber.index = newIdx;
    // 如果不需要跟踪副作用
    if (!shouldTrackSideEffects) {
      return;
    }
    // 获取它的老fiber
    const current = newFiber.alternate;
    // 如果有，说明是一更新的节点，存在老的真实dom
    if (current !== null) {
      return;
    } else {
      newFiber.flags |= Placement;
    }
  }

  function updateELement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      // 判断是否类型一样，则表示key和type都一样，可以复用老的fiber和真实DOM
      if (current.type === elementType) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;

        return existing;
      }
    }

    // 根据真实dom创建fiber
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (newChild !== null && typeof newChild === 'object') {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          // 如果key一样，进入更新元素的逻辑
          if (newChild.key === key) {
            return updateELement(returnFiber, oldFiber, newChild);
          }
        }
        default:
          return null;
      }
    }

    return null;
  }

  /**
   * 处理多个子节点
   * @param {*} returnFiber
   * @param {*} currentFiberChild
   * @param {*} newChildren
   * @returns
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null; // 返回的第一个儿子
    let previousNewFiber = null; // 上一个的一个新的子fiber
    let newIdx = 0; // 用来遍历新的虚拟dom的索引
    let oldFiber = currentFirstChild; // 第一个老fiber
    let nextOldFiber = null; // 下一个子fiber

    // 开始第一轮循环 如果老fiber有值，新的虚拟DOM也有值
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      // 先暂存一下老fiber
      nextOldFiber = oldFiber.sibling;
      // 试图更新或者复用老的fiber，这里返回的fiber可能是复用之前的也有可能是根据虚拟DOM创建的
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);

      if (newFiber === null) {
        break;
      }

      if (shouldTrackSideEffects) {
        // 如果有老fiber，但是新的fiber并没有成功复用老fiber和老的真实DOM，那就删除老fiber，在提交阶段会删除真实DOM
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }

      // 指定新fiber的位置
      placeChild(newFiber, newIdx);

      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }

      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    // 新的虚拟DOM已经循环完毕 3 => 2
    if (newIdx === newChildren.length) {
      // 删除剩下的老fiber
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      // 如果老的fiber已经没有了，新的虚拟DOM还有，进入插入新节点的逻辑
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
    }

    return resultingFirstChild;
  }

  /**
   * 比较子fiber dom-diff就是用老的子fiber链表和新的虚拟dom进行比较的过程，这里的究极目的就是两个，dom-diff和创建fiber
   * @param {*} returnFiber 新的父fiber，这里知识保证return的指向
   * @param {*} currentFiberChild 老fiber的第一个子fiber，用来和新的虚拟dom进行比较
   * @param {*} newChild 新的子虚拟dom，这里可能是一个单节点（对象），多节点（数组）
   */
  function reconcileChildFibers(returnFiber, currentFiberChild, newChild) {
    // 现在暂时值考虑新节点只有一个的情况
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFiberChild, newChild),
          );
        default:
          break;
      }
    }

    // newChild存在多节点情况，此时为一个数组
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFiberChild, newChild);
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

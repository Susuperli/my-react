import ReactSharedInternals from 'shared/ReactSharedInternals';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
};
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
};

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  // 这里注意甄别memoizedState，函数组件Fiber的memoizedState指向hooks链表，而hook的memoizedState指向状态
  hook.memoizedState = initialArg;
  const queue = {
    pending: null,
  };
  const dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  );

  return [hook.memoizedState, dispatch];
}

/**
 * 构建新的hooks
 */
function updateWorkInProgressHook() {
  // 获取将要构建的新的hook的老hook
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }

  // 根据老hook创建新的hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }

  return workInProgressHook;
}

function updateReducer(reducer) {
  // 获取新的hook
  const hook = updateWorkInProgressHook();
  // 获取新的hook的更新队列
  const queue = hook.queue;
  // 获取老的hook
  const current = currentHook;
  // 获取将要生效的更新队列
  const pendingQueue = queue.pending;
  // 初始化一个新的状态，取值为当前状态
  let newState = current.memoizedState;
  if (pendingQueue !== null) {
    queue.pending = null; // 重置更新队列
    const firstUpdate = pendingQueue.next; // 取出第一更新
    let update = firstUpdate;
    do {
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== null && update !== firstUpdate);
  }

  hook.memoizedState = newState;
  return [hook.memoizedState, queue.diapatch];
}

/**
 * 执行派发动作的方法，他要更新状态，并且让界面重新更新
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} ation 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  // 在每个hook里会存放一个更新队列，更新队列是一个更新对象的循环链表update1.next = update2.next = update1
  const update = {
    action, // {type: 'add', payload: 2} 派发的动作
    next: null, // 指向下一个更新对象或者第一更新对象
  };
  // 把当前的最新的更新添加到更新队列中，并且返回当前的根fiber
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}

/**
 * 挂载构建中的hook
 */
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null, // hook的状态
    queue: null, // 存放本hook的更新队列，queue.pending = update 的循环链表
    next: null, // 指向下一把hook，一个函数里里面可能会有多个hook，它们会组成一个单向链表
  };

  if (workInProgressHook === null) {
    // 当前函数对应的fiber的状态等于第一个hook对象
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }

  return workInProgressHook;
}

/**
 * 渲染组件函数
 * @param {*} current 老fiber
 * @param {*} workInProcess 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress; // Function组件对应的fiber
  // 需要在函数组件执行之前给ReactCurrentDispatcher.current赋值

  if (current !== null && current.memoizedState !== null) {
    // 存在老fiber且有hook链表，走更新逻辑
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }

  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  return children;
}

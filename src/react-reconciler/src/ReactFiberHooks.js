import ReactSharedInternals from 'shared/ReactSharedInternals';

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentRenderingFiber = null;
let workInProgressHook = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
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
    currentRenderingFiber,
    queue,
  );

  return [hook.memoizedState, dispatch];
}

/**
 * 执行派发动作的方法，他要更新状态，并且让界面重新更新
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} ation 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  console.log(fiber, queue, action);
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
    currentRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook.next = hook;
    workInProgressHook = hook;
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
  currentRenderingFiber = workInProgress; // Function组件对应的fiber
  // 需要在函数组件执行之前给ReactCurrentDispatcher.current赋值
  ReactCurrentDispatcher.current = HooksDispatcherOnMount;

  const children = Component(props);
  return children;
}

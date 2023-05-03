import { push, peek, pop } from './SchedulerMinHeap';
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from './SchedulerPriorities';

function getCurrentTime() {
  return performance.now();
}

// 大概十二天左右
var maxSigned31BitInt = 1073741823;
// Times out immediately 立刻过期 -1
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out 250毫秒
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
// 正常优先级的过期时间 5秒
var NORMAL_PRIORITY_TIMEOUT = 5000;
// 低优先级过期时间 10秒
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out 永远不过期
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

// 任务ID计数器
let taskIdCounter = 1;
// 任务的最小堆
const taskQueue = [];
let scheduleHostCallback = null;
let startTime = -1;
let currentTask = null;

// React 每一帧向浏览器申请5毫秒用于自己任务执行
// 如果5ms内没有完成，React也会放弃控制权，把控制交给浏览器
const frameInterval = 5;

const channel = new MessageChannel();
var port2 = channel.port2;
var port1 = channel.port1;
port1.onmessage = performWorkUntilDeadline;

export function scheduleCallback(priorityLevel, callback) {
  // 获取当前时间
  const currentTime = getCurrentTime();
  // 此任务的开始时间
  const startTime = currentTime;
  // 超时时间
  let timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT; // -1
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT; // 250ms
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT; // 1073741823
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT; // 10000
      break;
    case NormalPriority:
      timeout = NORMAL_PRIORITY_TIMEOUT; // 5000
      break;
  }

  // 计算此任务的过期时间
  const expirationTime = startTime + timeout;
  const newTask = {
    id: taskIdCounter++,
    callback, // 回调函数或者说任务函数
    priorityLevel, // 任务级别
    startTime, // 任务开始时间
    expirationTime, // 任务的过期时间
    sortIndex: expirationTime, // 排序依赖
  };
  // 向任务最小堆添加任务，排序的依据是过期时间
  push(taskQueue, newTask);
  // flushWork执行工作，刷新工作，执行任务，司机接人
  requestHostCallback(workLoop);
  return newTask;
}
function shouldYieldToHost() {
  // 用当前时间减去开始的时间就是过去的时间
  const timeElapsed = getCurrentTime() - startTime;
  // 如果流逝或者说经过的时间小于5毫秒，那就不需要放弃执行
  if (timeElapsed < frameInterval) {
    return false;
  }

  // 否则就是表示5毫秒用完了，需要放弃执行
  return true;
}

function workLoop(startTime) {
  let currentTime = startTime;
  // 取出优先级最高的任务 局长
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    // 如果此任务的过期时间小于当前时间， 也就是说没有过期，并且需要放弃执行 时间片到期
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      // 跳出工作循环
      break;
    }
    // 取出当前的任务中的回调函数 performConcurrentWorkOnRoot
    const callback = current.callback;
    if (typeof callback === 'funtion') {
      currentTask.callback = null;
      // 执行工作，如果返回新的函数，则表示当前的工作没有完成
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      if (typeof contionCallback === 'function') {
        currentTask.callback = continuationCallback;
        return true; // 还有任务要执行
      }
      // 如果此任务已经完成，则不需要再继续执行了，可以把此任务弹出
      if (currentTask === peek(taskQueue)) {
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }
    // 如果当前的任务执行完了，或者当前任务不合法，取出下一个任务执行
    currentTask = peek(taskQueue);
  }
  // 如果循环结束还有未完成的任务，那就表示hasMoreWork=true
  if (currentTask !== null) {
    return true;
  }
  // 没有任何要完成的任务了
  return false;
}

function requestHostCallback(workLoop) {
  // 先缓存回调函数
  scheduleHostCallback = workLoop;
  // 执行工作直到截止时间
  schedulePerformWorkUntilDeadline();
}
function schedulePerformWorkUntilDeadline() {
  port2.postMessage(null);
}
function performWorkUntilDeadline() {
  if (scheduleHostCallback) {
    // 先获取开始执行任务的时间
    // 表示时间片的开始
    startTime = getCurrentTime();
    // 是否有更多的工作要做
    let hasMoreWork = true;
    try {
      // 执行 flushWork，并判断有没有返回值
      hasMoreWork = scheduleHostCallback(startTime);
    } finally {
      // 执行完以后如果为true，说明还有更多工作要做
      if (hasMoreWork) {
        // 继续执行
        schedulePerformWorkUntilDeadline();
      } else {
        scheduleHostCallback = null;
      }
    }
  }
}

export {
  shouldYieldToHost as shouldYield,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
};

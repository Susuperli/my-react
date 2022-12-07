import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
import { IS_CAPTURE_PHASE } from './EventSystemFlags.js';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener.js';
import {
  addEventCaptureListener,
  addEventBubbleListener,
} from './EventListener.js';
import getEventTarget from './getEventTarget';
import getListener from './getListener';
import { HostComponent } from 'react-reconciler/src/ReactWorkTags';

const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2);

// 为我们allNativeEvents赋值，注册事件
SimpleEventPlugin.registerEvents();

/**
 * 监听根容器，即div#root
 * @param {*} rootContainerElement
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  // 监听根容器，为其添加listeningMarker属性，以达到只监听一次的目的
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
  }

  // 遍历所有原生事件比如click，进行监听
  allNativeEvents.forEach((domEventName) => {
    listenToNativeEvent(domEventName, true, rootContainerElement);
    listenToNativeEvent(domEventName, false, rootContainerElement);
  });
}

/**
 * 注册原生事件
 * @param {*} domEventName 原生事件，click
 * @param {*} isCapurePhaseListener 是否是捕获阶段
 * @param {*} target 目标DOM节点，div#root 容器节点
 */
export function listenToNativeEvent(
  domEventName,
  isCapurePhaseListener,
  target,
) {
  let eventSystemFlags = 0; // 默认是0 指的是冒泡  4是捕获
  if (isCapurePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }

  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapurePhaseListener,
  );
}

/**
 * 添加受限的监听器
 * @param {*} targetContainer
 * @param {*} domEventName
 * @param {*} eventSystemFlags
 * @param {*} isCapurePhaseListener
 */
function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapurePhaseListener,
) {
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags,
  );

  // 真实的事件代理就是在这里完成
  if (isCapurePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener);
  }
}

export function dispathEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer,
) {
  dispatchEventForPlugins(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer,
  );
}

function dispatchEventForPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer,
) {
  const nativeEventTarget = getEventTarget(nativeEvent);

  // 派发事件的数组
  const dispatchQueue = [];
  extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );

  processDispathQueue(dispatchQueue, eventSystemFlags);
}
function processDispathQueue(dispatchQueue, eventSystemFlags) {
  // 判断是否在捕获阶段
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
  }
}
function executeDispatch(event, listener, currentTarget) {
  // 合成事件实例currentTarget是在不断变化的
  // event nativeEventTarget 它的是原始的事件源，是永远不变的
  // event currentTarget 当前的事件源, 它是会随着时间回调的执行不断变化的
  event.currentTarget = currentTarget;
  listener(event);
}
function processDispatchQueueItemsInOrder(
  event,
  dispatchListeners,
  inCapturePhase,
) {
  if (inCapturePhase) {
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }

      executeDispatch(event, listener, currentTarget);
    }
  } else {
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }

      executeDispatch(event, listener, currentTarget);
    }
  }
}

function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer,
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );
}

/**
 * 计算单阶段的事件
 * @param {*} targetFiber
 * @param {*} reactName
 * @param {*} nativeEventType
 * @param {*} isCapturePhase
 */
export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase,
) {
  const captureName = reactName + 'Capture';
  const reactEventName = isCapturePhase ? captureName : reactName;
  const listeners = [];

  let instance = targetFiber;
  while (instance !== null) {
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      const listener = getListener(instance, reactEventName);

      if (listener) {
        listeners.push(createDispatchListener(instance, listener, stateNode));
      }
    }

    instance = instance.return;
  }

  return listeners;
}
function createDispatchListener(instance, listener, currentTarget) {
  return { instance, listener, currentTarget };
}

// 通过该插入为allNativeEvent赋值
import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from '../DOMEventProperties';
import { IS_CAPTURE_PHASE } from '../EventSystemFlags';
import { accumulateSinglePhaseListeners } from '../DOMPluginEventSystem';
import { SyntheticMouseEvent } from '../SyntheticEvent.js';

/**
 * 提取事件，把要执行回调函数添加到dispatchQueue中
 * @param {*} dispatchQueue 派发队列，里面放置我们的监听函数
 * @param {*} domEventName DOM事件名 click
 * @param {*} targetInst 目标fiber
 * @param {*} nativeEvent 原生事件
 * @param {*} nativeEventTarget 原生事件源
 * @param {*} eventSystemFlags 事件类型
 * @param {*} targetContainer 目标容器 div#root
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer,
) {
  const reactName = topLevelEventsToReactNames.get(domEventName); // 根据click获得onClick
  let SyntheticEventCtor; // 合成事件的构建函数
  // 根据不同的触发事件返回不同合成事件构建函数
  switch (domEventName) {
    case 'click':
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    default:
      break;
  }

  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    isCapturePhase,
  );

  // 如果有要执行的监听函数的话
  if (listeners.length > 0) {
    const event = new SyntheticEventCtor(
      reactName,
      domEventName,
      null,
      nativeEvent,
      nativeEventTarget,
    );

    dispatchQueue.push({
      event, // 合成事件实例
      listeners, // 监听函数数组
    });

    console.log(dispatchQueue, 'dispatchQueue');
  }
}

export { registerSimpleEvents as registerEvents, extractEvents };

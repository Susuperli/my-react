import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';

// 为我们allNativeEvents赋值，注册事件
SimpleEventPlugin.registerEvents();

/**
 * 监听根容器，即div#root
 * @param {*} rootContainerElement
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  allNativeEvents.forEach((domEventName) => {
    console.log(domEventName, 'domEventName');
  });
}

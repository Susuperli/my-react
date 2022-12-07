/**
 * 完成事件代理
 * @param {*} target 根容器
 * @param {*} eventType 事件类型
 * @param {*} listener 监听函数
 * @returns
 */
export function addEventCaptureListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, true);

  return listener;
}

export function addEventBubbleListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, false);

  return listener;
}

// 存储所有的原生事件
export const allNativeEvents = new Set();

/**
 * 注册两个阶段的事件
 * @param {*} registrationName React事件名 onClick
 * @param {*} dependencies 原生事件数组 [click]
 */
export function registerTwoPhaseEvent(registrationName, dependencies) {
  // 注册冒泡事件对应关系
  registerDirectEvent(registrationName, dependencies);
  // 注册捕获事件的对应关系
  registerDirectEvent(registrationName + 'Capture', dependencies);
}

/**
 * 注册直接事件，把事件加到allNativeEvents
 * @param {*} registrationName
 * @param {*} dependencies
 */
export function registerDirectEvent(registrationName, dependencies) {
  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}

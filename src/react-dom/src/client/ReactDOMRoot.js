import {
  createContainer,
  updateContainer,
} from 'react-reconciler/src/ReactFiberReconciler';
import { listenToAllSupportedEvents } from 'react-dom-bindings/src/events/DOMPluginEventSystem';

function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}
ReactDOMRoot.prototype.render = function (children) {
  const root = this._internalRoot;
  // root.containerInfo.innerHTML = '';
  updateContainer(children, root);
};

/**
 * @description 创建root节点
 * @param {*} container   // div#root
 * @returns
 */
export function createRoot(container) {
  const root = createContainer(container);
  // 在此处进行事件绑定，且只绑定这一次

  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(root);
}

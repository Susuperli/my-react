import {
  createContainer,
  updateContainer,
} from 'react-reconciler/src/ReactFiberReconciler';

function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}
ReactDOMRoot.prototype.render = function (children) {
  const root = this._internalRoot;

  updateContainer(children, root);
};

/**
 * @description 创建root节点
 * @param {*} container   // div#root
 * @returns
 */
export function createRoot(container) {
  const root = createContainer(container);

  return new ReactDOMRoot(root);
}

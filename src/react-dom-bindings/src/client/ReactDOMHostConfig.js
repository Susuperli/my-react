import {
  setInitialProperties,
  diffProperties,
  updateProperties,
} from './ReactDOMComponent';
import {
  precacheFiberNode,
  updateFiberNode,
  updateFiberProps,
} from './ReactDOMComponentTree';

export function shouldSetTextContent(type, props) {
  return (
    typeof props.children === 'string' || typeof props.children === 'nunber'
  );
}

/**
 * 创建文本节点实例
 * @param {*} content 文本内容
 */
export function createTextInstance(content) {
  return document.createTextNode(content);
}

/**
 * 创建实例节点
 * @param {*} type 节点类型
 * @param {*} props 属性
 * @param {*} internalInstanceHandle fiber
 * @returns dom实例
 */
export function createInstance(type, props, internalInstanceHandle) {
  const domElement = document.createElement(type);
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberNode(domElement, props);

  return domElement;
}

/**
 * 原生插入dom节点
 * @param {*} parent 父节点
 * @param {*} child 子节点
 */
export function appendInitialChild(parent, child) {
  parent.appendChild(child);
}

/**
 * 计划初始化子节点属性
 * @param {*} domElement 父节点
 * @param {*} type 父节点类型
 * @param {*} props 父节点属性
 */
export function finalizeInitialChildren(domElement, type, props) {
  setInitialProperties(type, domElement, props);
}

/**
 * appendChild
 * @param {*} parentInstance
 * @param {*} child
 */
export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child);
}
/**
 * insertBefore
 * @param {*} parentInstance
 * @param {*} child
 * @param {*} beforeChild
 */
export function insertBefore(parentInstance, child, beforeChild) {
  parentInstance.insertBefore(child, beforeChild);
}

export function prepareUpdate(domElement, type, oldProps, newProps) {
  return diffProperties(domElement, type, oldProps, newProps);
}

export function commitUpdate(
  domElement,
  updatePayload,
  type,
  oldProps,
  newProps,
) {
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  updateFiberProps(domElement, newProps);
}

export function removeChild(parentInstance, child) {
  parentInstance.removeChild(child);
}

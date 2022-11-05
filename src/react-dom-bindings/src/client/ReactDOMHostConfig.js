import { setInitialProperties } from './ReactDOMComponent';

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
 * 创建原生的真实dom节点
 * @param {*} type
 * @returns
 */
export function createInstance(type) {
  return document.createElement(type);
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

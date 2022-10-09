// 这里的jsxDEV实际上是相当于之前的React.createElement，做的内容就是将用户写入的标签式的虚拟dom转化成浏览器能够识别的虚拟dom。当然在此之前需要经过babel的转化。

import hasOwnProperty from 'shared/hasOwnProperty';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};
function hasValidKey(config) {
  return config.key !== undefined;
}
function hasValidRef(config) {
  return config.ref !== undefined;
}

function ReactElement(type, key, ref, props) {
  // 返回react元素，也就是虚拟dom
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type, // 标签类型
    key, // 唯一标识
    ref, // 指向真实dom
    props, // 属性
  };
}

export function jsxDEV(type, config) {
  // debugger;
  let propName; // 属性名
  const props = {}; // 属性对象
  let key = null; // 每个虚拟dom都有一个可选的key值，用来区分同一父节点下的子节点
  let ref = null; // 指向真实dom

  // 判断key & ref是否存在
  if (hasValidKey(config)) {
    key = config.key;
  }
  if (hasValidRef(config)) {
    ref = config.ref;
  }

  for (propName in config) {
    // 这里主要是筛选出原型上面的方法和保留属性
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }

  return ReactElement(type, key, ref, props);
}

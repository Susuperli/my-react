import { setValueForStyles } from './CSSPropertyOperations';
import { setValueForProperty } from './DOMPropertyOperations';
import setTextContent from './setTextContent';

const STYLE = 'style';
const CHILDREN = 'children';

function setInitialDOMProperties(tag, domElement, nextProps) {
  for (const propKey in nextProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      const nextProp = nextProps[propKey];

      // 添加style属性
      if (propKey === STYLE) {
        setValueForStyles(domElement, nextProp);
      } else if (propKey === CHILDREN) {
        // 向文本节点中加入文本
        if (typeof nextProp === 'string') {
          setTextContent(domElement, nextProp);
        } else if (typeof nextProp === 'number') {
          setTextContent(domElement, `${nextProp}`);
        }
      } else if (nextProp !== null) {
        // 添加其他dom属性
        setValueForProperty(domElement, propKey, nextProp);
      }
    }
  }
}

/**
 * 设置出事属性
 * @param {*} tag
 * @param {*} domElement
 * @param {*} props
 */
export function setInitialProperties(tag, domElement, props) {
  // 设置初始dom属性
  setInitialDOMProperties(tag, domElement, props);
}

export function diffProperties(domElement, tag, lastProps, nextProps) {
  let updatePayload = null;
  let propKey;
  let styleName;
  let styleUpdates = null;
  // 处理属性的删除，如果说一个属性在老对象里有，新对象没有的话，那么意味着删除
  for (propKey in lastProps) {
    // 如果新属性对象里有此属性，或者老的没有此属性，或者老的是个null，则跳过删除
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] === null
    ) {
      continue;
    }

    // 特殊处理样式
    if (propKey === STYLE) {
      const lastStyle = lastProps[propKey];
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }
          styleUpdates[styleName] = '';
        }
      }
    } else {
      (updatePayload = updatePayload || []).push(propKey, null);
    }
  }
  // 遍历新的属性对象
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey]; // 新属性中的值
    const lastProp = lastProps !== null ? lastProps[propKey] : undefined; // 老属性
    // 不再关注新属性中没有的值
    if (
      !nextProps.hasOwnProperty(propKey) ||
      nextProp === lastProp ||
      (nextProp === null && lastProp === null)
    ) {
      continue;
    }

    if (propKey === STYLE) {
      if (lastProp) {
        // 计算要删除的行内的样式
        for (styleName in lastProp) {
          // 如果此样式对象里在的某个属性老的style里有，新的style里没有
          if (
            lastProp.hasOwnProperty(styleName) &&
            (!nextProp || !nextProp.hasOwnProperty(styleName))
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = '';
          }
        }
        // 遍历新的样式对象
        for (styleName in nextProp) {
          // 如果说新的属性有，并且新属性的值和老属性不一样
          if (
            nextProp.hasOwnProperty(styleName) &&
            lastProp[styleName] !== nextProp[styleName]
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = nextProp[styleName];
          }
        }
      } else {
        styleUpdates = nextProp;
      }
    } else if (propKey === CHILDREN) {
      if (typeof nextProp === 'string' || typeof nextProp === 'number') {
        (updatePayload = updatePayload || []).push(propKey, nextProp);
      }
    } else {
      (updatePayload = updatePayload || []).push(propKey, nextProp);
    }
  }
  if (styleUpdates) {
    (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
  }
  return updatePayload; //[key1,value1,key2,value2]
}

export function updateProperties(domElement, updatePayload) {
  updateDOMProperties(domElement, updatePayload);
}
function updateDOMProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      setValueForProperty(domElement, propValue);
    } else if (propKey === CHILDREN) {
      setTextContent(domElement, propValue);
    } else {
      setValueForProperty(domElement, propKey, propValue);
    }
  }
}

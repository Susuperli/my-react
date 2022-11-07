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

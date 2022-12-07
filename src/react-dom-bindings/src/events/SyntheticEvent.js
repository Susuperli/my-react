import assign from 'shared/assign';

function functionThatReturnTrue() {
  return true;
}
function functionThatReturnFalse() {
  return false;
}

const MouseEventInterface = {
  clientX: 0,
  clientY: 0,
};

function createSyntheticEvent(inter) {
  /**
   * 合成事件的基类
   * @param {*} reactName react事件名 onClick
   * @param {*} reactEventType click
   * @param {*} targetInst 事件源对应的fiber实例
   * @param {*} nativeEvent 原生事件对象
   * @param {*} nativeEventTarget 原生事件源，span 事件源对用的那个真实DOM
   */
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  ) {
    this._reactName = reactName;
    this.type = reactEventType;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;
    // 把接口上面对应属性从原生事件上拷贝到合成事件实例上
    for (const propName in inter) {
      if (!inter.hasOwnProperty(propName)) {
        continue;
      }
      this[propName] = nativeEvent[propName];
    }
    // 是否已经阻止默认事件
    this.isDefaultPrevented = functionThatReturnFalse;
    // 是否已经阻止继续传播
    this.isPropagationStopped = functionThatReturnFalse;

    return this;
  }

  // 重写preventDefault和stopPropagation，主要是兼容浏览器
  assign(SyntheticBaseEvent.prototype, {
    preventDefault() {
      const event = this.nativeEvent;
      if (event.preventDefault) {
        event.preventDefault();
      } else {
        event.returnValue = false;
      }
      this.isDefaultPrevented = functionThatReturnTrue;
    },
    stopPropagation() {
      const event = this.nativeEvent;
      if (event.stopPropagation) {
        event.stopPropagation();
      } else {
        event.cancelBubble = true;
      }
      this.isPropagationStopped = functionThatReturnTrue;
    },
  });

  return SyntheticBaseEvent;
}

export const SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);

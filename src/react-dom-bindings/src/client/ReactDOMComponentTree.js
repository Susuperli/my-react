const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;

/**
 * 从真实DOM节点，获取它对应的fiber节点
 * @param {*} targetNode
 * @returns
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey];

  return targetInst;
}

/**
 * 提前在dom上面缓存对应的fiber
 * @param {*} hostInst
 * @param {*} node
 */
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}

export function updateFiberNode(node, props) {
  node[internalPropsKey] = props;
}
export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}

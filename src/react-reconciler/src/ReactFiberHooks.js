/**
 * 渲染组件函数
 * @param {*} current 老fiber
 * @param {*} workInProcess 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM
 */
export function renderWithHooks(current, workInProcess, Component, props) {
  const children = Component(props);

  return children;
}

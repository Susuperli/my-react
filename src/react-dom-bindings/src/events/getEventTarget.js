export default function getEventTarget(nativeEvent) {
  // 兼容一下浏览器
  const target = nativeEvent.target || nativeEvent.srcElement || window;

  return target;
}

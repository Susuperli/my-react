import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  // hooks 用到更新 更新需要有事件触发
  return (
    <h1 id="container" onClick={() => console.log('click')}>
      hello<span style={{ color: 'red' }}>world</span>
    </h1>
  );
}

const element = <FunctionComponent />;

const root = createRoot(document.getElementById('root'));

root.render(element);

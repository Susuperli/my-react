import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  // hooks 用到更新 更新需要有事件触发
  return (
    <h1
      id="container"
      onClick={() => console.log('父冒泡')}
      onClickCapture={() => console.log('父捕获')}
    >
      <span
        onClick={() => console.log('子冒泡')}
        onClickCapture={() => console.log('子捕获')}
      >
        click me
      </span>
    </h1>
  );
}

// const element = (
//   <h1>
//     hello<span style={{ color: 'red' }}>world</span>
//   </h1>
// );

const root = createRoot(document.getElementById('root'));

root.render(<FunctionComponent />);

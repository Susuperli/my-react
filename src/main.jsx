import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  // hooks 用到更新 更新需要有事件触发
  return (
    <h1
      onClick={(event) => console.log(`ParentBubble`)}
      onClickCapture={(event) => {
        console.log(`ParentCapture`);
        // event.stopPropagation();
      }}
    >
      <span
        onClick={(event) => {
          console.log(`ChildBubble`);
          event.stopPropagation();
        }}
        onClickCapture={(event) => console.log(`ChildCapture`)}
      >
        click me
      </span>
    </h1>
  );
}

const root = createRoot(document.getElementById('root'));

root.render(<FunctionComponent />);

import * as React from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A" id="A">
        A
      </li>
      <li key="B" id="B">
        B
      </li>
      <li key="C" id="C">
        C
      </li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="B" id="B2">
        B2
      </li>
    </ul>
  );
}

let element = <FunctionComponent />;
//old let element = React.createElement(FunctionComponent);
//new let element = jsx(FunctionComponent);
const root = createRoot(document.getElementById('root'));
//把element虚拟DOM渲染到容器中
root.render(element);

//老fiber树 div#root对应的fiber.child=FunctionComponent的fiber.child=button.fiber

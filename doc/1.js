const Placement = 0b001;
const Update = 0b010;

let flags = 0b000;

// 增加操作
flags |= Placement;
flags |= Update;
console.log(flags.toString(2));

// 删除操作
flags = flags & ~Placement;

console.log(flags.toString(2));
console.log(flags);

//判断是否包含

// 0b010 & 0b001 = 0b000
console.log((flags & Placement) === Placement);
// 0b010 & 0b010 = 0b010
console.log((flags & Update) === Update);
//判断不包含
console.log((flags & Placement) === 0);
console.log((flags & Update) === 0);

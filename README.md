# Dva Toolkit

![](https://img.shields.io/github/workflow/status/kunduin/dva-toolkit/CI)
![](https://img.shields.io/npm/v/dva-toolkit)
![](https://img.shields.io/npm/l/dva-toolkit)
![](https://img.shields.io/bundlephobia/min/dva-toolkit) 

Dva Toolkit 是为了给 Dva 社区带来 @redux/toolkit 一样的体验而诞生的强类型支持工具，提供自然且良好的类型推断体验，可以在大多数情况下省去类型声明，除了 Payload 部分必须使用 PayloadAction 声明。

```typescript
const { model, action: { add, addDelay }, initState } = createDvaSlice({
  namespace: 'count',
  state: 0,
  reducers: {
    add (state, { payload }: PayloadAction<number|void>) {
      return state + (payload || 1)
    }
  },
  effects: {
    * addDelay ({ payload }: PayloadAction<number>, { put, call }) {
      yield call(delay, 100)
      yield put({ type: 'add', payload })
    }
  }
})

app.model(model)
app.start()
app._store.dispatch(addDelay(2))
expect(app._store.getState().count).toEqual(0)
setTimeout(() => {
  expect(app._store.getState().count).toEqual(2)
  done()
}, 200)
```

## Install

```shell
npm i dva-toolkit

yarn add dva-toolkit
```

## 核心函数

本项目目前只提供 `createDvaSlice` 一个函数，提供类似 `@redux/toolkit` 中 `createSlice` 类似的功能。

`createDvaSlice` 的参数就和 dva 的 model 配置一摸一样，这是为了完美兼容过去的项目，因此过度起来十分简单，对过去的代码没有任何侵入性。`createDvaSlice` 是个支持范型的函数，因此如果希望指定 state 的类型可以直接 `createDvaSlice<IState>({...})`，但该函数返回的 `initState` 可以用作类型推断，所以没有必须声明状态类型的情况。

```typescript
const { initState } = createDvaSlice({...})
type IState = NonNullable<typeof initState>
```

目前 `createDvaSlice` 函数的返回对象只有 `model`、 `action`、`initState` 属性。`model` 是直接注入 dva 中的对象，action 包含所有生成 action 的函数。 initState 属性则是只用来类型推断，永远不会变化的初始状态。

如上面的代码展示的那样，action 包含两个自动生成的函数 `add`, `addDelay`

```typescript
const add = (payload: number|void) => ({payload, type:'count/add'})

const addDelay = (payload: number) => ({payload, type:'count/addDelay'})
```

注意，必须要将 reducer 和 effect 里的 action 定义成 `PayloadAction` 类型，函数的参数才能正确推断，否则无法使用该项目。`PayloadAction` 是遵守 redux 约定，将信息都放在 payload 里的类型。

action 中的函数是用来生成 `{payload: ..., type}` 对象的，你还需要把生成的对象放到 dispatch 中

```typescript
dispatch(add(1))
```

## 与 UMI 一起使用

umi3 中新加入了验证 dva model 写的对不对的操作，居然是直接用 babel 静态分析。成功让本项目的写法不被理解。需要配置文件里关掉这个设置。未来会贡献 umi dva 的插件让他支持一下。

```js
  dva: {
    skipModelValidate: true
  }
```

## 开发者的话

2021 年，大家广泛的拥抱 typescript，但是 dva 的维护力度并不强势，如果你想要选择一个状态管理工具，redux + @redux/toolkit、mobx 都是很好的选择。这个项目旨在为 umi 使用者和一些使用 dva 的历史项目提供更好的开发体验，不作为 dva 的宣传力量。

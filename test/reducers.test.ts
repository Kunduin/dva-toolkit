import { PayloadAction } from '@reduxjs/toolkit'
import create from 'dva'
import { createDvaSlice } from '../src'

declare module 'dva' {
  export interface DvaInstance {
    _store: any
  }
}

describe('reducers', () => {
  it('enhancer', () => {
    const app = create()

    const { model, action: { add } } = createDvaSlice({
      namespace: 'count',
      state: 3,
      reducers: [
        {
          add (state, { payload }: PayloadAction<number|void>) {
            return state + (payload || 1)
          },
          up (state, { payload }: PayloadAction<number>) {
            return state - (payload || 1)
          }
        },
        function (reducer) {
          return function (state, action) {
            if (action.type === 'square') {
              return state * state
            }
            return reducer(state, action)
          }
        }
      ]
    })

    app.model(model)
    app.router(() => ({}))
    app.start()
    app._store.dispatch({ type: 'square' })
    app._store.dispatch(add())
    expect(app._store.getState().count).toEqual(10)
  })

  it('extraReducers', () => {
    const reducers = {
      count: (state: any, { type }: any) => {
        if (type === 'add') {
          return state + 1
        }
        // default state
        return 0
      }
    }
    const app = create({
      extraReducers: reducers
    })

    app.router(() => ({}))
    app.start()

    expect(app._store.getState().count).toEqual(0)
    app._store.dispatch({ type: 'add' })
    expect(app._store.getState().count).toEqual(1)
  })

  // core 没有 routing 这个 reducer，所以用例无效了
  xit('extraReducers: throw error if conflicts', () => {
    const app = create({
      extraReducers: { routing () {} }
    })
    expect(() => {
      app.start()
    }).toThrow(/\[app\.start\] extraReducers is conflict with other reducers/)
  })

  it('onReducer with saveAndLoad', () => {
    let savedState: any = null
    const saveAndLoad = (r: any) => (state: any, action: any) => {
      const newState = r(state, action)
      if (action.type === 'save') {
        savedState = newState
      }
      if (action.type === 'load') {
        return savedState
      }
      return newState
    }
    const app = create({
      onReducer: saveAndLoad
    })

    const { model, action: { add } } = createDvaSlice({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state) {
          return state + 1
        }
      }
    })
    app.model(model)
    app.router(() => ({}))
    app.start()

    app._store.dispatch(add())
    expect(app._store.getState().count).toEqual(1)
    app._store.dispatch({ type: 'save' })
    expect(app._store.getState().count).toEqual(1)
    app._store.dispatch(add())
    app._store.dispatch({ type: 'count/add' })
    expect(app._store.getState().count).toEqual(3)
    app._store.dispatch({ type: 'load' })
    expect(app._store.getState().count).toEqual(1)
  })

  it('onReducer', () => {
    const undo = (r: any) => (state: any, action: any) => {
      const newState = r(state, action)
      return { present: newState, routing: newState.routing }
    }
    const app = create({
      onReducer: undo
    })
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        update (state) {
          return state + 1
        }
      }
    })

    app.router(() => ({}))
    app.start()

    expect(app._store.getState().present.count).toEqual(0)
  })

  it('effects put reducers when reducers is array', () => {
    const app = create()
    const { model, action: { putSetState } } = createDvaSlice({
      namespace: 'count',
      state: 0,
      effects: {
        * putSetState (_: PayloadAction, { put }) {
          yield put({ type: 'setState' })
        }
      },
      reducers: [
        {
          setState (state) {
            return state + 1
          }
        },
        (r) => (state, action) => {
          const newState = r(state, action)
          return newState
        }
      ]
    })
    app.model(model)
    app.router(() => ({}))
    app.start()
    const putSetStateAction = putSetState()

    app._store.dispatch(putSetStateAction)
    expect(app._store.getState().count).toEqual(1)
  })
})

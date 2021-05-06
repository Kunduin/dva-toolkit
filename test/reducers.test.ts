import { PayloadAction } from '@reduxjs/toolkit'
import create from 'dva'
import { createDvaSlice } from '../src'

declare module 'dva' {
  export interface DvaInstance {
    _store: any
  }
}

describe('reducers', () => {
  it('basic', () => {
    const app = create()
    const { model, action: { add } } = createDvaSlice({
      namespace: 'hello',
      state: 0,
      reducers: {
        add (state, { payload }: PayloadAction<number|void>) {
          return state + (payload || 1)
        }
      }
    })
    app.model(model)
    app.router(() => ({}))
    app.start()
    app._store.dispatch(add(2))
    expect(app._store.getState().hello).toEqual(2)
  })

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
})

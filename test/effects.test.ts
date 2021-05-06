import { PayloadAction } from '@reduxjs/toolkit'
import create from 'dva'
import { createDvaSlice } from '../src'
declare module 'dva' {
  export interface DvaInstance {
    _store: any
  }
}

const delay = (timeout: number) => new Promise(resolve => setTimeout(resolve, timeout))

describe('effects', () => {
  it('put action', done => {
    const app = create()
    const { model, action: { addDelay } } = createDvaSlice({
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

    app.router(() => ({}))
    app.start()
    app._store.dispatch(addDelay(2))
    expect(app._store.getState().count).toEqual(0)
    setTimeout(() => {
      expect(app._store.getState().count).toEqual(2)
      done()
    }, 200)
  })

  it('type: takeLatest', done => {
    const app = create()

    const { model, action: { addDelay } } = createDvaSlice({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }: PayloadAction<number|void>) {
          return state + (payload || 1)
        }
      },
      effects: {
        addDelay: [
          function * ({ payload }: PayloadAction<number>, { call, put }) {
            yield call(delay, 100)
            yield put({ type: 'add', payload })
          },
          { type: 'takeLatest' }
        ]
      }
    })
    app.model(model)
    app.router(() => ({}))
    app.start()

    // Only catch the last one.
    app._store.dispatch(addDelay(2))
    app._store.dispatch(addDelay(3))

    setTimeout(() => {
      expect(app._store.getState().count).toEqual(3)
      done()
    }, 200)
  })
})

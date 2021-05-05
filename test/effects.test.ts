import { PayloadAction } from '@reduxjs/toolkit'
import create from 'dva'
import { createDvaSlice } from '../src'
declare module 'dva' {
  export interface DvaInstance {
    _store: any
  }
}

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout))

describe('effects', () => {
  it('put action', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        * addDelay ({ payload }, { put, call }) {
          yield call(delay, 100)
          yield put({ type: 'add', payload })
        }
      }
    })
    app.router(() => ({}))
    app.start()
    app._store.dispatch({ type: 'count/addDelay', payload: 2 })
    expect(app._store.getState().count).toEqual(0)
    setTimeout(() => {
      expect(app._store.getState().count).toEqual(2)
      done()
    }, 200)
  })

  function testAppCreator (opts?: any) {
    const app = create(opts)
    const { model } = createDvaSlice({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }: PayloadAction<number>) {
          return state + payload || 1
        }
      },
      effects: {
        * putWithNamespace ({ payload }: PayloadAction<number>, { put }) {
          yield put({ type: 'count/add', payload })
        },
        * putWithoutNamespace ({ payload }: PayloadAction<number>, { put }) {
          yield put({ type: 'add', payload })
        }
      }
    })
    app.model(model)
    return app
  }

  it('put action with namespace will get a warning', () => {
    const app = testAppCreator()
    const logs = []

    app.router(() => ({}))
    app.start()
    expect(app._store.getState().count).toEqual(0)
    expect(logs.length).toEqual(0)
    app._store.dispatch({ type: 'count/putWithNamespace', payload: 2 })
    expect(logs.length).toEqual(1)
    expect(logs[0]).toEqual(
      'Warning: [sagaEffects.put] count/add should not be prefixed with namespace count'
    )
    app._store.dispatch({ type: 'count/putWithoutNamespace', payload: 2 })
    expect(logs.length).toEqual(1)
    expect(app._store.getState().count).toEqual(4)
  })

  it('test disable namespacePrefixWarning', () => {
    const app = testAppCreator({ namespacePrefixWarning: false })
    const logs = []

    app.router(() => ({}))
    app.start()
    expect(app._store.getState().count).toEqual(0)
    expect(logs.length).toEqual(0)
    app._store.dispatch({ type: 'count/putWithNamespace', payload: 2 })
    expect(logs.length).toEqual(0)
    app._store.dispatch({ type: 'count/putWithoutNamespace', payload: 2 })
    expect(logs.length).toEqual(0)
    expect(app._store.getState().count).toEqual(4)
  })

  it('put multi effects in order', done => {
    const app = create()
    app.model({
      namespace: 'counter',
      state: {
        count: 0,
        resolveCount: 0
      },
      reducers: {
        dump (state, { payload }) {
          return {
            ...state,
            ...payload
          }
        }
      },
      effects: {
        * changeCountDelay ({ payload }, { put, call }) {
          yield call(delay, 200)
          yield put({ type: 'dump', payload: { count: payload } })
        },
        * process ({ payload }, { put, select }) {
          yield put({ type: 'changeCountDelay', payload })
          const count = yield select(state => state.counter.count)
          yield put({ type: 'dump', payload: { resolveCount: count } })
        }
      }
    })
    app.router(() => ({}))
    app.start()
    app._store.dispatch({ type: 'counter/process', payload: 1 }).then(() => {
      expect(app._store.getState().counter.resolveCount).toEqual(1)
      done()
    })
    expect(app._store.getState().counter.resolveCount).toEqual(0)
  })

  it('take', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        * addDelay ({ payload }, { put, call }) {
          yield call(delay, payload.delay || 100)
          yield put({ type: 'add', payload: payload.amount })
        },
        * test (_, { put, select, take }) {
          yield put({ type: 'addDelay', payload: { amount: 2 } })
          yield take('addDelay/@@end')
          const count = yield select(state => state.count)
          yield put({ type: 'addDelay', payload: { amount: count, delay: 0 } })
        }
      }
    })
    app.router(() => ({}))
    app.start()
    app._store.dispatch({ type: 'count/test' })
    setTimeout(() => {
      expect(app._store.getState().count).toEqual(4)
      done()
    }, 300)
  })

  it('take with array of actions', () => {
    const app = create()
    let takenCount = 0
    app.model({
      namespace: 'count',
      state: null,
      reducers: {
        addRequest () {
          return 1
        },
        addFailure () {
          return -1
        },
        addSuccess () {
          return 0
        }
      },
      effects: {
        * add (action, { put }) {
          yield put({ type: 'addRequest' })
          if (action.amount > 0.5) {
            yield put({ type: 'addSuccess' })
          } else {
            yield put({ type: 'addFailure' })
          }
        },
        * test (action, { put, take }) {
          yield put({ type: 'add', amount: action.amount })
          yield take(['addSuccess', 'addFailure'])
          takenCount += 1
        }
      }
    })
    app.router(() => ({}))
    app.start()
    app._store.dispatch({ type: 'count/test', amount: 0 })
    expect(app._store.getState().count).toEqual(-1)
    app._store.dispatch({ type: 'count/test', amount: 1 })
    expect(app._store.getState().count).toEqual(0)
    expect(takenCount).toEqual(2)
  })

  it('dispatch action for other models', () => {
    const app = create()
    app.model({
      namespace: 'loading',
      state: false,
      reducers: {
        show () {
          return true
        }
      }
    })
    app.model({
      namespace: 'count',
      state: 0,
      effects: {
        * addDelay (_, { put }) {
          yield put({ type: 'loading/show' })
        }
      }
    })
    app.router(() => ({}))
    app.start()
    app._store.dispatch({ type: 'count/addDelay' })
    expect(app._store.getState().loading).toEqual(true)
  })

  it('onError', () => {
    const errors = []
    const app = create({
      onError: (error: any, dispatch) => {
        error.preventDefault()
        errors.push(error.message as never)
        dispatch({ type: 'count/add' })
      }
    })
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        * addDelay ({ payload }, { put }) {
          if (!payload) {
            throw new Error('effect error')
          } else {
            yield put({ type: 'add', payload })
          }
        }
      }
    })
    app.router(() => ({}))
    app.start()
    app._store.dispatch({ type: 'count/addDelay' })
    expect(errors).toEqual(['effect error'])
    expect(app._store.getState().count).toEqual(1)
    app._store.dispatch({ type: 'count/addDelay', payload: 2 })
    expect(app._store.getState().count).toEqual(3)
  })

  it('onError: extension', () => {
    const app = create({
      // @ts-ignore
      onError (err: any, dispatch: any, extension:any) {
        err.preventDefault()
        dispatch({
          type: 'err/append',
          payload: extension
        })
      }
    })
    app.model({
      namespace: 'err',
      state: [],
      reducers: {
        append (state, action) {
          return [...state, action.payload]
        }
      },
      effects: {
        // eslint-disable-next-line
        *generate() {
          throw new Error('Effect error')
        }
      }
    })
    app.router(() => ({}))
    app.start()
    app._store.dispatch({
      type: 'err/generate',
      payload: 'err.payload'
    })
    expect(app._store.getState().err.length).toEqual(1)
    expect(app._store.getState().err[0].key).toEqual('err/generate')
    expect(app._store.getState().err[0].effectArgs[0].type).toEqual('err/generate')
    expect(app._store.getState().err[0].effectArgs[0].payload).toEqual('err.payload')
  })

  it('type: takeLatest', done => {
    const app = create()
    const takeLatest = { type: 'takeLatest' }
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        addDelay: [
          function * ({ payload }, { call, put }) {
            yield call(delay, 100)
            yield put({ type: 'add', payload })
          },
          // @ts-ignore
          takeLatest
        ]
      }
    })
    app.router(() => ({}))
    app.start()

    // Only catch the last one.
    app._store.dispatch({ type: 'count/addDelay', payload: 2 })
    app._store.dispatch({ type: 'count/addDelay', payload: 3 })

    setTimeout(() => {
      expect(app._store.getState().count).toEqual(3)
      done()
    }, 200)
  })

  xit('type: throttle throw error if no ms', () => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      effects: {
        addDelay: [
          function * () {
            yield console.log(1)
          },
          { type: 'throttle' }
        ]
      }
    })
    expect(() => {
      app.router(() => ({}))
      app.start()
    }).toThrow(/app.start: opts.ms should be defined if type is throttle/)
  })

  it('type: throttle', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        addDelay: [
          function * ({ payload }, { call, put }) {
            yield call(delay, 120)
            yield put({ type: 'add', payload })
          },
          // @ts-ignore
          { type: 'throttle', ms: 100 }
        ]
      }
    })
    app.router(() => ({}))
    app.start()

    // Only catch the last one.
    app._store.dispatch({ type: 'count/addDelay', payload: 2 })
    app._store.dispatch({ type: 'count/addDelay', payload: 3 })

    setTimeout(() => {
      expect(app._store.getState().count).toEqual(2)
      done()
    }, 200)
  })

  it('type: watcher', done => {
    const watcher = { type: 'watcher' }
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        addWatcher: [
          function * ({ take, put, call }) {
            while (true) {
              const { payload } = yield take('addWatcher')
              yield call(delay, 100)
              yield put({ type: 'add', payload })
            }
          },
          // @ts-ignore
          watcher
        ]
      }
    })
    app.router(() => ({}))
    app.start()

    // Only catch the first one.
    app._store.dispatch({ type: 'count/addWatcher', payload: 2 })
    app._store.dispatch({ type: 'count/addWatcher', payload: 3 })

    setTimeout(() => {
      expect(app._store.getState().count).toEqual(2)
      done()
    }, 200)
  })

  it('type: poll', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        pollAdd: [
          function * (_, { put }) {
            yield put({ type: 'add', payload: 1 })
          },
          // @ts-ignore
          { type: 'poll', delay: 1000 }
        ]
      }
    })
    app.router(() => ({}))
    app.start()

    app._store.dispatch({ type: 'count/pollAdd-start' })

    setTimeout(() => {
      app._store.dispatch({ type: 'count/pollAdd-stop' })
      expect(app._store.getState().count).toEqual(2)
      done()
    }, 2000)
  })

  it('type: poll and stop', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        pollAdd: [
          function * (_, { put }) {
            yield put({ type: 'add', payload: 1 })
          },
          // @ts-ignore
          { type: 'poll', delay: 1000 }
        ]
      }
    })
    app.router(() => ({}))
    app.start()

    app._store.dispatch({ type: 'count/pollAdd-start' })
    // should work one time
    app._store.dispatch({ type: 'count/pollAdd-stop' })

    setTimeout(() => {
      expect(app._store.getState().count).toEqual(1)
      done()
    }, 200)
  })

  it('type: poll with payload', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        pollAdd: [
          function * ({ payload }, { put }) {
            yield put({ type: 'add', payload })
          },
          // @ts-ignore
          { type: 'poll', delay: 1000 }
        ]
      }
    })
    app.router(() => ({}))
    app.start()

    app._store.dispatch({ type: 'count/pollAdd-start', payload: 2 })

    setTimeout(() => {
      app._store.dispatch({ type: 'count/pollAdd-stop' })
      expect(app._store.getState().count).toEqual(4)
      done()
    }, 2000)
  })

  it('type: poll, start many time', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        pollAdd: [
          function * ({ payload }, { put }) {
            yield put({ type: 'add', payload })
          },
          // @ts-ignore
          { type: 'poll', delay: 1000 }
        ]
      }
    })
    app.router(() => ({}))
    app.start()

    app._store.dispatch({ type: 'count/pollAdd-start', payload: 2 })

    setTimeout(() => {
      // second start should not work
      app._store.dispatch({ type: 'count/pollAdd-start', payload: 3 })
      app._store.dispatch({ type: 'count/pollAdd-stop' })
      expect(app._store.getState().count).toEqual(6)
      done()
    }, 3000)
  })

  it('type: poll, start many time 2', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        pollAdd: [
          function * (_, { put }) {
            yield put({ type: 'add', payload: 1 })
          },
          // @ts-ignore
          { type: 'poll', delay: 1000 }
        ]
      }
    })
    app.router(() => ({}))
    app.start()

    app._store.dispatch({ type: 'count/pollAdd-start' })
    // second start should not work
    app._store.dispatch({ type: 'count/pollAdd-start' })

    setTimeout(() => {
      app._store.dispatch({ type: 'count/pollAdd-stop' })
      expect(app._store.getState().count).toEqual(3)
      done()
    }, 3000)
  })

  it('type: poll, start and stop many time', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        pollAdd: [
          function * (_, { put }) {
            yield put({ type: 'add', payload: 1 })
          },
          // @ts-ignore
          { type: 'poll', delay: 1000 }
        ]
      }
    })
    app.router(() => ({}))
    app.start()

    app._store.dispatch({ type: 'count/pollAdd-start' })
    app._store.dispatch({ type: 'count/pollAdd-stop' })
    app._store.dispatch({ type: 'count/pollAdd-start' })

    setTimeout(() => {
      app._store.dispatch({ type: 'count/pollAdd-stop' })
      expect(app._store.getState().count).toEqual(3)
      done()
    }, 2000)
  })

  xit('nonvalid type', () => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      effects: {
        addDelay: [
          function * () {
            yield console.log(1)
          },
          // @ts-ignore
          { type: 'nonvalid' }
        ]
      }
    })

    expect(() => {
      app.router(() => ({}))
      app.start()
    }).toThrow(/app.start: effect type should be takeEvery, takeLatest, throttle or watcher/)
  })

  it('onEffect', done => {
    const SHOW = '@@LOADING/SHOW'
    const HIDE = '@@LOADING/HIDE'

    const app = create()

    // Test model should be accessible
    let modelNamespace = null
    // Test onEffect should be run orderly
    let count = 0
    let expectedKey = null

    app.use({
      extraReducers: {
        loading (state = false, action) {
          switch (action.type) {
            case SHOW:
              return true
            case HIDE:
              return false
            default:
              return state
          }
        }
      },
      // @ts-ignore
      onEffect (effect, { put }, model, key) {
        expectedKey = key
        modelNamespace = model.namespace
        return function * (...args) {
          count *= 2
          yield put({ type: SHOW })
          yield effect(...args)
          yield put({ type: HIDE })
        }
      }
    })

    app.use({
      // @ts-ignore
      onEffect (effect) {
        return function * (...args) {
          count += 2
          yield effect(...args)
          count += 1
        }
      }
    })

    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state) {
          return state + 1
        }
      },
      effects: {
        * addRemote (_, { put }) {
          yield delay(100)
          yield put({ type: 'add' })
        }
      }
    })

    app.router(() => ({}))
    app.start()

    expect(app._store.getState().loading).toEqual(false)

    app._store.dispatch({ type: 'count/addRemote' })
    expect(app._store.getState().loading).toEqual(true)
    expect(modelNamespace).toEqual('count')
    expect(expectedKey).toEqual('count/addRemote')

    setTimeout(() => {
      expect(app._store.getState().loading).toEqual(false)
      expect(app._store.getState().count).toEqual(1)
      expect(count).toEqual(5)
      done()
    }, 200)
  })

  it('return Promise', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        * addDelay ({ payload }, { put, call, select }) {
          yield call(delay, payload.delay || 100)
          yield put({ type: 'add', payload: payload.amount })
          return yield select(state => state.count)
        }
      }
    })
    app.router(() => ({}))
    app.start()
    const p1 = app._store.dispatch({
      type: 'count/addDelay',
      payload: { amount: 2 }
    })
    const p2 = app._store.dispatch({
      type: 'count/add',
      payload: 2
    })
    expect(p1 instanceof Promise).toEqual(true)
    expect(p2).toEqual({ type: 'count/add', payload: 2 })
    expect(app._store.getState().count).toEqual(2)
    p1.then(count => {
      expect(count).toEqual(4)
      expect(app._store.getState().count).toEqual(4)
      done()
    })
  })

  it('return Promises when trigger the same effect multiple times', done => {
    const app = create()
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add (state, { payload }) {
          return state + payload || 1
        }
      },
      effects: {
        * addDelay ({ payload }, { put, call, select }) {
          yield call(delay, payload.delay || 100)
          yield put({ type: 'add', payload: payload.amount })
          return yield select(state => state.count)
        }
      }
    })
    app.router(() => ({}))
    app.start()

    const p1 = app._store.dispatch({
      type: 'count/addDelay',
      payload: { delay: 100, amount: 1 }
    })
    const p2 = app._store.dispatch({
      type: 'count/add',
      payload: 2
    })
    const p3 = app._store.dispatch({
      type: 'count/addDelay',
      payload: { delay: 200, amount: 3 }
    })
    expect(p1 instanceof Promise).toEqual(true)
    expect(p2).toEqual({ type: 'count/add', payload: 2 })
    expect(app._store.getState().count).toEqual(2)
    p1.then(count => {
      expect(count).toEqual(3)
      expect(app._store.getState().count).toEqual(3)
      p3.then(count => {
        expect(count).toEqual(6)
        expect(app._store.getState().count).toEqual(6)
        done()
      })
    })
  })
})

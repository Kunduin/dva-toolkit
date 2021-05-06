import { createDvaSlice, PayloadAction } from 'dva-toolkit'

const delay = (time: number) => new Promise((resolve) => setTimeout(resolve, time))

export const { model, action: countAction, initState } = createDvaSlice({
  namespace: 'count',
  state: { value: 1 },
  reducers: {
    add (state, { payload }: PayloadAction<number|void>) {
      return { value: state.value + (payload || 1) }
    }
  },
  effects: {
    * addDelay ({ payload }: PayloadAction<number>, { put, call }) {
      yield call(delay, 2000)
      yield put({ type: 'add', payload })
    }
  }
})

export default model

export type CountState = NonNullable<typeof initState>

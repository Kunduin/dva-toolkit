import type { AnyAction } from '@reduxjs/toolkit'
import type { Model } from 'dva'
import type { DvaSliceCaseEffects } from './effects'
import type { DvaSliceCaseReducers } from './reducers'
import type { CreateDvaSliceOption, DvaSlice } from './slice'

/**
 * Better dva config function inspired by @redux/toolkit
 *
 * @param options same config as dva model but with strong type support
 * @returns model for dva use and actions to be use directly
 * @public
 */
export function createDvaSlice <
  State,
  CR extends DvaSliceCaseReducers<State> = DvaSliceCaseReducers<State>,
  CE extends DvaSliceCaseEffects = DvaSliceCaseEffects,
  Name extends string = string
> (
  options: CreateDvaSliceOption<State, CR, CE, Name>
): DvaSlice<State, CR, CE> {
  const { namespace, reducers, effects } = options
  if (!namespace) {
    throw new Error('`namespace` is a required option for createDvaSlice')
  }

  const actionCreators = {
    ...createReducersActions(namespace, reducers),
    ...createEffectsActions(namespace, effects)
  }

  return {
    model: options as Model,
    action: actionCreators as any,
    initState: options.state
  }
}

/**
 * create reducers actions
 *
 * @private
 */
function createReducersActions (namespace:string, reducers?: DvaSliceCaseReducers) {
  if (!reducers) return {}

  const pureReducers = Array.isArray(reducers) ? reducers[0] : reducers
  return createActionsByKeys(namespace, Object.keys(pureReducers))
}

/**
 * create effects actions
 *
 * @private
 */
function createEffectsActions (namespace: string, effects?: DvaSliceCaseEffects) {
  if (!effects) return {}
  return createActionsByKeys(namespace, Object.keys(effects))
}

/**
 * create actions by namespace and function name
 *
 * @private
 */
function createActionsByKeys (namespace: string, keys: string[]): Record<string, Function> {
  const actions: Record<string, Function> = {}

  keys.forEach(key => {
    actions[key] = createAction(getType(namespace, key))
  })
  return actions
}

/**
 * create action
 *
 * @private
 */
const createAction = (type: string): Function =>
  (arg: any): AnyAction => ({
    type,
    payload: arg
  })

/**
 * generate type by namespace and function name
 */
function getType (slice: string, actionKey: string): string {
  return `${slice}/${actionKey}`
}

export * from './actions'
export * from './effects'
export * from './reducers'
export * from './slice'
export type { PayloadAction } from '@reduxjs/toolkit'

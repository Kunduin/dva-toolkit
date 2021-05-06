import type { DvaSliceCaseEffects } from './effects'
import type { Model, SubscriptionsMapObject } from 'dva'
import type { DvaSliceCaseReducers, ValidateDvaSliceCaseReducers } from './reducers'
import type { DvaCaseAction } from './actions'

/**
 * construct dva model config
 *
 * @public
 */
export type CreateDvaSliceOption<
  State = any,
  CR extends DvaSliceCaseReducers<State> = DvaSliceCaseReducers<State>,
  CE extends DvaSliceCaseEffects = DvaSliceCaseEffects,
  Name extends string = string
> = {
  /**
   * dva namespace
   */
  namespace: Name,

  /**
   * dva state
   */
  state?: State,

  /**
   * dva reducer list
   */
  reducers?: ValidateDvaSliceCaseReducers<State, CR>,

  /**
   * dva(saga) effect list
   */
  effects?: CE,

  /**
   * dva(route) subscription list
   */
  subscriptions?: SubscriptionsMapObject,
}

/**
 * dva slice result, `model` is dva model, `action` is typed action generator
 *
 * @public
 */
export type DvaSlice<
  State = any,
  CR extends DvaSliceCaseReducers<State> = DvaSliceCaseReducers<State>,
  CE extends DvaSliceCaseEffects = DvaSliceCaseEffects,
> = {
  /**
   * dva model
   */
  model: Model,

  /**
   * generated actions
   */
  action: DvaCaseAction<CR, CE>

  /**
   * init state, won't change, only used for type deduce
   */
  initState?: State
}

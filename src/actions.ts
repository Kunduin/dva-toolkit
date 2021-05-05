import { ActionCreatorWithoutPayload, ActionCreatorWithPayload } from '@reduxjs/toolkit'
import { DvaCaseEffectWithType, DvaSliceCaseEffects } from './effects'
import { DvaReducers, DvaSliceCaseReducers } from './reducers'

/**
 * dva reducer function => action
 *
 * @typeParam R reducer
 * @public
 */
export type ActionCreatorDvaCaseReducer<R> =
  R extends (state: any, action: infer Action) => any
    ? Action extends { payload: infer P }
      ? ActionCreatorWithPayload<P>
      : ActionCreatorWithoutPayload
    : ActionCreatorWithoutPayload

/**
 * dva action need
 *
 * @public
 */
export type ActionCreatorDvaReducers<Reducers extends DvaReducers> = {
  [Type in keyof Reducers]: ActionCreatorDvaCaseReducer<Reducers[Type]>
}

/**
 * dva
 *
 * @public
 */
export type DvaReducersAction<
  CR extends DvaSliceCaseReducers
> = CR extends DvaSliceCaseReducers<any, infer Reducers>
  ? ActionCreatorDvaReducers<Reducers>
  : never

export type ActionCreatorDvaEffect<E> =
  E extends (action: infer Action, effects: any) => any
    ? Action extends { payload: infer P }
      ? ActionCreatorWithPayload<P>
      : ActionCreatorWithoutPayload
    : ActionCreatorWithoutPayload

export type DvaEffectsAction<
  CE extends DvaSliceCaseEffects
> = {
  [Type in keyof CE]: CE[Type] extends DvaCaseEffectWithType
    ? ActionCreatorDvaEffect<CE[Type][0]>
    : ActionCreatorDvaEffect<CE[Type]>
}

export type DvaCaseAction<
  CR extends DvaSliceCaseReducers<any>,
  CE extends DvaSliceCaseEffects
> = DvaReducersAction<CR> & DvaEffectsAction<CE>

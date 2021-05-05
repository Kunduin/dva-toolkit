import type { Action, CaseReducer, PayloadAction } from '@reduxjs/toolkit'

/**
 * normal dva reducers object
 *
 * @public
 */
export type DvaReducers<State = any> = {
  [K: string]: CaseReducer<State, PayloadAction<any>>
}

/**
 * dva enhancer support
 *
 * @public
 */
export type DvaReducerEnhancer<
  S = any,
  R extends DvaReducers<S> = DvaReducers<S>,
  A extends Action = PayloadAction<any>
> = (reducer: R[keyof R]) => (state: S, action: A) => ReturnType<CaseReducer<S>>

export type DvaReducersWithEnhancer<
  S = any,
  Reducers extends DvaReducers<S> = DvaReducers<S>,
  ReducerEnhancer extends DvaReducerEnhancer<S, Reducers> = DvaReducerEnhancer<S, Reducers>
> = [Reducers, ReducerEnhancer]

/**
 * dva config reducers type
 *
 * @public
 */
export type DvaSliceCaseReducers<
  S = any,
  Reducers extends DvaReducers<S> = DvaReducers<S>,
> = DvaReducersWithEnhancer<S, Reducers> | Reducers

/**
 * 没看懂，但加上去就对了
 *
 * TODO: try to understand this func
 */
export type ValidateDvaSliceCaseReducers<
  S,
  ACR extends DvaSliceCaseReducers<S>
> = ACR & {
    [T in keyof ACR]: ACR[T] extends {
      reducer(s: S, action: any): any
    }
      ? {}
      : {}
  }

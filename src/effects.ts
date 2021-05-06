import type { EffectType } from 'dva'
import type { call, put, take, select, cancel } from 'redux-saga/effects'
import type { PayloadAction } from '@reduxjs/toolkit'

/**
 * saga effects supported by dva
 *
 * @public
 */
export type SagaEffectsCommandMap = {
  put: typeof put,
  call: typeof call,
  select: typeof select,
  take: typeof take,
  cancel: typeof cancel,
  [key: string]: any
}

/**
 * pure effect method
 *
 * @public
 */
export type DvaCaseEffects =
  (action: PayloadAction<any>, effects: SagaEffectsCommandMap) => Generator

/**
 * effect with saga config
 *
 * @public
 */
export type DvaCaseEffectWithType =
  [DvaCaseEffects, {type: EffectType}]

/**
 * all effect case
 *
 * @public
 */
export type DvaCaseEffectValue = DvaCaseEffects | DvaCaseEffectWithType

/**
 * effects in dva config
 *
 * @public
 */
export type DvaSliceCaseEffects = {
    [K: string]: DvaCaseEffectValue
};

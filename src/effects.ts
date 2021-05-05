import type { EffectType } from 'dva'
import type { call, put, take, select, cancel } from 'redux-saga/effects'
import type { PayloadAction } from '@reduxjs/toolkit'

/**
 * dva 支持的 saga command 列表
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
 * effect 方法
 *
 * @public
 */
export type DvaCaseEffects =
  (action: PayloadAction<any>, effects: SagaEffectsCommandMap) => Generator

/**
 * 有 effect 类型的 effect 方法
 *
 * @public
 */
export type DvaCaseEffectWithType =
  [DvaCaseEffects, {type: EffectType}]

export type DvaCaseEffectValue = DvaCaseEffects | DvaCaseEffectWithType

/**
 * dva 配置中 effects 列表的类型
 *
 * @public
 */
export type DvaSliceCaseEffects = {
    [K: string]: DvaCaseEffectValue
};

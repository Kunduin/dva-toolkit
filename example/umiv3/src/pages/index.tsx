import { useDispatch, useSelector } from 'dva'
import styles from './index.less'
import { countAction, CountState } from './models/count'

export default function IndexPage () {
  const count = useSelector<{count: CountState}, CountState>((state) => state.count)
  const dispatch = useDispatch()
  return (
    <div>
      <h1 className={styles.title}>{count.value}</h1>
      <button onClick={() => dispatch(countAction.add(2))}>add 2</button>
      <button onClick={() => dispatch(countAction.addDelay(2))}>add delay 2</button>
    </div>
  )
}

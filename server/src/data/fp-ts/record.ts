import { toArray, fromFoldable } from 'fp-ts/lib/Record'
import { Task, chain, task } from 'fp-ts/lib/Task'
import { reduce, array } from 'fp-ts/lib/Array'
import { identity } from 'fp-ts/lib/function'
import { getFoldableComposition } from 'fp-ts/lib/Foldable'

/**
 * Flattens a record of tasks to a single task.
 * @param rkta
 */
export function flattenTaskRecord<K extends string | number | symbol, A>(
  rkta: Record<K, Task<A>>,
): Task<Record<K, A>> {
  const array_: [string, Task<A>][] = toArray(rkta)
  const record = fromFoldable<Task<A>, [string, Task<A>]>(
    {
      concat: identity,
    },
    array,
  )
  return reduce(identity, chain)(toArray(rkta))
}

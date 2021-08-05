export class LazyPromise<T> implements PromiseLike<T> {
  private promise: Promise<T> | undefined;

  constructor(private f: () => Promise<T>) {}

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): PromiseLike<TResult1 | TResult2> {
    if (this.promise == null) {
      this.promise = this.f();
    }
    return this.promise.then(onfulfilled, onrejected);
  }
}

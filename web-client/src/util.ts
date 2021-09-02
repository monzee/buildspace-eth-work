type Variants = Record<string, any[]>

type Visitor<T, V extends Variants> = { [K in keyof V]: (...branch: V[K]) => T }

export interface Sum<V extends Variants> {
  <T>(visitor: Visitor<T, V>): T
}

export async function watch<T, R>(
  stream: AsyncIterator<T, R>,
  onNext?: (value: T) => void
): Promise<R> {
  while (true) {
    let next = await stream.next();
    if (!next.done) {
      onNext && onNext(next.value);
    }
    else {
      return next.value;
    }
  }
}

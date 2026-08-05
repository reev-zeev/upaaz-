/**
 * وُصلة — Result Pattern
 * نوع النتيجة لمعالجة الأخطاء بشكل وظيفي
 */

export type Result<T, E = string> = Success<T, E> | Failure<T, E>;

export class Success<T, E> {
  readonly ok = true as const;
  constructor(public readonly value: T) {}
  map<U>(fn: (v: T) => U): Result<U, E> {
    return new Success(fn(this.value));
  }
}

export class Failure<T, E> {
  readonly ok = false as const;
  constructor(
    public readonly code: E,
    public readonly message: string,
    public readonly details?: Record<string, unknown>
  ) {}
  map<U>(_fn: (v: T) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }
}

export function success<T, E = never>(value: T): Result<T, E> {
  return new Success(value);
}

export function failure<T = never, E = string>(
  code: E,
  message: string,
  details?: Record<string, unknown>
): Result<T, E> {
  return new Failure(code, message, details);
}

export function isSuccess<T, E>(result: Result<T, E>): result is Success<T, E> {
  return result.ok;
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<T, E> {
  return !result.ok;
}
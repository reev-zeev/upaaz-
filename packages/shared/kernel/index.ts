/**
 * وُصلة — Domain Kernel
 * Building blocks for Domain-Driven Design
 */

export abstract class ValueObject<T> {
  constructor(protected readonly _value: T) {}
  get value(): T { return this._value; }
  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this._value) === JSON.stringify(other._value);
  }
}

export abstract class Entity<TId> {
  constructor(public readonly id: TId) {}
  private _domainEvents: DomainEvent[] = [];
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }
  clearEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}

export abstract class AggregateRoot<TId> extends Entity<TId> {
  protected _version: number = 1;
  get version(): number { return this._version; }
}

export interface DomainEvent {
  eventName: string;
  aggregateId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}
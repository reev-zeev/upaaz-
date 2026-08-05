/**
 * وُصلة — Domain Event Bus
 * ناقل الأحداث للنظام الموزع
 */

export interface DomainEvent {
  eventName: string;
  aggregateId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private fallbackHandlers: EventHandler[] = [];

  on(eventName: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler);
    this.handlers.set(eventName, existing);
  }

  onAny(handler: EventHandler): void {
    this.fallbackHandlers.push(handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) ?? [];
    const allHandlers = [...handlers, ...this.fallbackHandlers];

    await Promise.allSettled(
      allHandlers.map(h =>
        h(event).catch(err => {
          console.error(`[EventBus] Handler failed for ${event.eventName}:`, err);
        })
      )
    );
  }

  removeAll(): void {
    this.handlers.clear();
    this.fallbackHandlers = [];
  }
}

export const globalEventBus = new EventBus();
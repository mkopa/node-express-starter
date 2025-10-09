/**
 * Simple EventBus implementation using TypeDI container.
 *
 * Handlers register themselves on import (see SendPasswordEmailHandler).
 * The bus is synchronous for simplicity (handlers are awaited if they return promises).
 *
 * This is intentionally small and dependency-free so it's easy to reason about
 * in a recruitment task. In production you could swap this for a queue-backed bus.
 */

import { Service } from 'typedi';

type EventHandler = {
  // accept any event type, handler decides what to do
  handle(event: unknown): Promise<void> | void;
  // optional: event class name or predicate can be used by more advanced buses
  supportsEvent?(event: unknown): boolean;
};

@Service('EventBus')
export class EventBus {
  private handlers: EventHandler[] = [];

  register(handler: EventHandler) {
    this.handlers.push(handler);
  }

  async publish(event: unknown): Promise<void> {
    // For each handler, if it supports the event (or no supportsEvent => attempt),
    // call handle(). Await promises so handlers complete before returning.
    const promises: Promise<void>[] = [];

    for (const handler of this.handlers) {
      try {
        if (typeof handler.supportsEvent === 'function') {
          if (!handler.supportsEvent(event)) continue;
        }
        const result = handler.handle(event);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (err) {
        // Swallow handler errors so one failing handler doesn't break others.
        // In production, record these to monitoring (Sentry/Datadog).
        // eslint-disable-next-line no-console
        console.error('Event handler error (sync):', err);
      }
    }

    if (promises.length > 0) {
      // Wait for all async handlers to finish
      await Promise.allSettled(promises);
    }
  }
}

/**
 * SendPasswordEmailHandler
 *
 * Example event handler for UserOnboardedEvent:
 * - Logs that email would be sent (this is a stub for the recruitment task)
 * - Persists an audit log entry via AuditRepository
 *
 * The module registers an instance of the handler on the EventBus when imported.
 * Ensure this file is imported during app bootstrap (index.ts imports it).
 */

import { Service, Container } from 'typedi';
import logger from '../../utils/logger';
import { UserOnboardedEvent } from '../../domain/events/UserOnboardedEvent';
import { EventBus } from '../../domain/EventBus';
import { AuditRepository } from '../../repositories/AuditRepository';

@Service()
class SendPasswordEmailHandler {
  private auditRepo: AuditRepository;

  constructor() {
    // Resolve audit repository lazily from container
    this.auditRepo = Container.get(AuditRepository);
  }

  supportsEvent(event: unknown): boolean {
    return event instanceof UserOnboardedEvent;
  }

  async handle(event: unknown): Promise<void> {
    if (!(event instanceof UserOnboardedEvent)) return;

    // NOTE: In real app you'd send an email via SMTP / SES / Mailgun.
    // Here we simulate send and persist audit record.
    const e = event as UserOnboardedEvent;

    // Simulated email payload
    const emailPayload = {
      to: e.email,
      subject: 'Set your password',
      // A production implementation would send a link containing the token.
      body: `Hello, please set your password using this one-time token: ${e.token}`,
    };

    try {
      // Log send action (simulate actual send)
      logger.info(`(stub) Sending password setup email to ${e.email}`);
      logger.debug('Email payload:', emailPayload);

      // Persist audit log (non-transactional here)
      await this.auditRepo.insert(
        e.userId,
        'PASSWORD_EMAIL_SENT',
        `Password setup email queued/sent to ${e.email}`,
        {
          companyId: e.companyId,
          tokenHashPreview: e.token.slice(0, 8) + '... (raw token omitted)',
          occurredAt: e.occurredAt.toISOString(),
        }
      );
      logger.info(`Audit log written for user ${e.userId}`);
    } catch (err) {
      // Handler should not throw to caller of EventBus.publish; swallow but log.
      logger.error('SendPasswordEmailHandler failed:', err);
    }
  }
}

/**
 * Register handler instance on the EventBus immediately on import.
 * This pattern avoids needing explicit handler registration in bootstrap.
 */
(() => {
  try {
    const bus = Container.get<EventBus>('EventBus');
    const handler = Container.get(SendPasswordEmailHandler);
    bus.register(
      handler as unknown as { handle: (e: unknown) => Promise<void>; supportsEvent?: any }
    );
  } catch (err) {
    // If DI container not set up yet this will fail during import; log for debugging.
    // In typical app bootstrap this file is imported after container is initialized.
    // eslint-disable-next-line no-console
    console.warn('Could not register SendPasswordEmailHandler immediately:', err);
  }
})();

export { SendPasswordEmailHandler };

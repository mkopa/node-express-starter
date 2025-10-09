/**
 * Domain event: UserOnboardedEvent
 *
 * Emitted after a successful onboarding (user created, token generated).
 * Handlers may send email, write audit logs, enqueue jobs, etc.
 */

export class UserOnboardedEvent {
  public readonly userId: number;
  public readonly email: string;
  public readonly companyId: number;
  public readonly token: string;
  public readonly occurredAt: Date;

  constructor(payload: { userId: number; email: string; companyId: number; token: string }) {
    this.userId = payload.userId;
    this.email = payload.email;
    this.companyId = payload.companyId;
    this.token = payload.token;
    this.occurredAt = new Date();
  }
}

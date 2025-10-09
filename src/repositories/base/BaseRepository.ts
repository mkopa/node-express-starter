export abstract class BaseRepository {
  /**
   * Sanitize table names (cannot use parameterized queries for identifiers)
   */
  protected sanitizeIdentifier(identifier: string): string {
    // Only allow alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
      throw new Error('Invalid identifier');
    }
    return identifier;
  }

  /**
   * Build WHERE clause safely
   */
  protected buildWhereClause(conditions: Record<string, unknown>): {
    clause: string;
    values: unknown[];
  } {
    const clauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined && value !== null) {
        clauses.push(`${this.sanitizeIdentifier(key)} = ?`);
        values.push(value);
      }
    }

    return {
      clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      values,
    };
  }
}

declare namespace Express {
  export interface Request {
    id?: string;
    user?: {
      id: number;
      email: string;
      role: string;
    };
  }
}

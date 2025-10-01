declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
        company?: string;
        subrole?: string;
      };
    }
  }
}

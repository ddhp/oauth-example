import { Session } from 'express-session'

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    oauthNextUrl?: string;
    user?: import('@/line').User;
  }
}

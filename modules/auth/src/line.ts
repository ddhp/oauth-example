import { Router, Request, Response, RequestHandler } from 'express';
import { Redis } from 'ioredis';
import { AuthorizationCode } from 'simple-oauth2';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import config from '@/config';

interface AuthConfig {
  redisClient: Redis;
}

export interface User {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  provider: string;
  accessToken: string;
}

interface IdToken {
  iss: string;
  sub: string;
  aud: string;
  amr: string[];
  name: string;
  picture: string;
}

const oauthConfig = {
  client: {
    id: config.channelId,
    secret: config.channelSecret,
  },
  auth: {
    tokenHost: config.lineApiHost,
    tokenPath: '/oauth2/v2.1/token',
    authorizeHost: config.accessApiHost,
    authorizePath: '/oauth2/v2.1/authorize',
  }
};

const oauthClient = new AuthorizationCode(oauthConfig);

const redirectUrlFromReq = (req: Request) => {
  const origin = `${req.protocol}://${req.headers.host}`
  const prefix = ((req.headers['x-forwarded-prefix'] as string) || '').replace(/\/+$/, '');
  const currentUrl = `${origin}${prefix}${req.originalUrl}`;
  const redirectUrl = new URL('callback', currentUrl).toString();
  console.log('c', currentUrl, redirectUrl);
  return redirectUrl;
};

const scope = ['profile', 'openid'].join(' ');

const serializeUser = (id: string, name: string, picture: string, accessToken: string) => {
  return {
    id,
    provider: 'line',
    displayName: name,
    avatarUrl: picture,
    accessToken,
  };
};

const saveUserSession: RequestHandler = async (req, res, next) => {
  const { session } = req;
  const { code } = req.query;
  console.log(code);

  delete session.oauthState;
  const { token: { id_token: idToken, access_token: accesToken } } = await oauthClient.getToken({
    code: code as string,
    scope,
    redirect_uri: redirectUrlFromReq(req),
  });

  const decodedIdToken = jwt.verify(idToken, config.channelSecret) as IdToken;
  const userInfo = serializeUser(decodedIdToken.sub, decodedIdToken.name, decodedIdToken.picture, accesToken);
  req.session.user = userInfo;

  next();
}

const redirectToNext: RequestHandler = (req, res) => {
  const { session } = req;
  const { oauthNextUrl } = session;
  if (oauthNextUrl) {
    delete session.oauthNextUrl;
    return res.redirect(oauthNextUrl);
  }
  res.redirect('/');
};

export default function lineLoginHandler(redisClient: Redis) {
  const app = Router();

  app.get('/login', (req, res) => {
    const { session } = req;

    const state = nanoid();

    if (session) {
      session.oauthState = state;
      session.oauthNextUrl = req.headers.referer;
    }

    const authorizationUri = oauthClient.authorizeURL({
      redirect_uri: redirectUrlFromReq(req),
      scope,
      state,
    });

    res.redirect(authorizationUri);
  });

  app.get('/callback', (req, res, next) => {
    const { state } = req.query;
    console.log(state);

    // check if state matches
    const { session } = req;
    if (!session || session.oauthState !== state) {
      return res.status(400).send('invalid state');
    }

    delete session.oauthState;

    next();
  }, saveUserSession, redirectToNext);

  return app;
}

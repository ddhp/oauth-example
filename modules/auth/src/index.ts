import express from 'express';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import ms from 'ms';
import line from '@/line';
import logger from '@/logger';
import config from '@/config';

const app = express();
const port = process.env.PORT || 3200;

const RedisStore = connectRedis(session);
const redisClient = new Redis(config.redisConfig);

app.use(express.json());

app.use(
  session({
    cookie: {
      httpOnly: true,
      maxAge: ms(config.sessionMaxAge),
      sameSite: 'lax',
      secure: 'auto'
    },
    store: new RedisStore({ client: redisClient }),
    saveUninitialized: false,
    secret: config.sessionSecret,
    resave: false,
  })
)

logger.info({a: 'a'});

app.use('/auth/line', line(redisClient));
app.use('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    res.status(401).send('not loggedin');
  }
  const { user } = req.session;
  res.send(user)
});

app.use('/logout', (req, res) => {
  if (req.session && req.session.user) {
    delete req.session.user;
  }
  res.redirect('/');
});

app.get('/', (req, res) => {
  const { session } = req;
  let html = 'hello, please <a href="/auth/line/login">login</a>';
  if (session.user) {
    const { displayName, avatarUrl } = session.user;
    html = `hello ${displayName} <img style="display: inline; width: 50px; height: 50px" src=${avatarUrl} > <a href="/logout">logout</>`
  }
  res.send(html);
});

app.listen(port, () => {
  logger.info(`Example app listening at http://localhost:%d`, port)
});

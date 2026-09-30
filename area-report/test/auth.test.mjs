import test from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync} from 'node:crypto';
import {passwordValid,signedSession,authorized} from '../lib/auth.mjs';
test('公開ログインは正しいパスワードと有効な署名を必要とする',async()=>{process.env.APP_PASSWORD_HASH='test:'+scryptSync('test-password','test',32).toString('hex');process.env.SESSION_SECRET='test-only-session-secret';try{assert.equal(await passwordValid('wrong'),false);assert.equal(await passwordValid('test-password'),true);assert.equal(authorized({headers:{}}),false);const token=signedSession(100);assert.equal(authorized({headers:{cookie:'area_session='+token}},101),true);assert.equal(authorized({headers:{cookie:'area_session='+token}},100+8*86400000),false);assert.equal(authorized({headers:{cookie:'area_session='+token+'x'}},101),false);}finally{delete process.env.APP_PASSWORD_HASH;delete process.env.SESSION_SECRET;}});

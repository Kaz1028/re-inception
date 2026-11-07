import {mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const key of ['APP_PASSWORD_HASH','SESSION_SECRET','CRON_SECRET'])if(!process.env[key])throw Error(key+' must be configured before deployment');

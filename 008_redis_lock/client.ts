import { createClient } from 'redis';

export const client = createClient({
    password: process.env.password,
    socket: {
        host: 'redis-17114.c54.ap-northeast-1-2.ec2.cloud.redislabs.com',
        port: 17114
    }
});

client.connect();
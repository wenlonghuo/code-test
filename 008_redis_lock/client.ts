import { createClient } from 'redis';

export const client = createClient({
    password: process.env.password,
    socket: {
        host: 'redis-10112.c54.ap-northeast-1-2.ec2.cloud.redislabs.com',
        port: 10112
    }
});

client.connect();
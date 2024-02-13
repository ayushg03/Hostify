import express, { Request, Response } from 'express';
import {generateSlug}   from 'random-word-slugs';
import  {ECSClient, RunTaskCommand}   from '@aws-sdk/client-ecs';
import Redis from 'ioredis';
import {Server, Socket} from 'socket.io';
import http from 'http';

const app = express();
const PORT: number = 9000;

const subscriber=new Redis('');
const server = http.createServer(app); // Create an HTTP server instance

const io = new Server(server, { cors: { origin: '*' } }); // Pass the server instance to Socket.IO

io.on('connection',socket=>{
    socket.on('subscribe',channel=>{
        socket.join(channel);
        socket.emit('message',`Joined ${channel}`);
    })
})

server.listen(9001, () => {
    console.log('Socket Server running on 9001');
});





const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const config = {
    CLUSTER: '',
    TASK: ''
}

app.use(express.json());

app.post('/project',async(req:Request,res:Response)=>{
    const { gitURL,slug } = req.body
    const projectSlug =slug? slug: generateSlug();
    
    console.log(gitURL);
    //spin the container
    const command =  new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [],
                securityGroups: []
            }
        },
        overrides: {
            containerOverrides: [{
                name: 'builder-image',
                environment: [
                    {name: 'GIT_REPOSITORY_URL', value:gitURL},
                    {name: 'PROJECT_ID', value:projectSlug },
                    {name: 'ACCESS_KEY_ID', value: ''},
                    {name: 'SECRET_ACCESS_KEY', value: '' }
                ]
            }]
        } 
    })

    await ecsClient.send(command);
    
    return res.json({ status: 'queued', data:{projectSlug, url:`http:\\${projectSlug}.localhost:8000`}})

})

function initRedisSubscribe() {
  console.log("Subscribed to logs...")
  subscriber.psubscribe('logs:*');
  subscriber.on('pmessage', (pattern, channel, message) => {
    io.to(channel).emit('message', message);
});

}

initRedisSubscribe();

app.listen(PORT, () => console.log(`API Server Running..${PORT}`));

import express, { Request, Response } from 'express';
import {generateSlug}   from 'random-word-slugs';
import  {ECSClient, RunTaskCommand}   from '@aws-sdk/client-ecs';

const app = express();
const PORT: number = 9000;

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
    const { gitURL } = req.body
    const projectSlug = generateSlug();
    
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

app.listen(PORT, () => console.log(`API Server Running..${PORT}`));

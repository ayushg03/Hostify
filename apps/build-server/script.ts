const {exec} = require('child_process');
const path = require('path');
const fs = require('fs');
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const Redis =require('ioredis');


const publisher=new Redis('');

const s3Client= new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    }
})

const PROJECT_ID=process.env.PROJECT_ID;

function publishLog(log:string) {
    publisher.publish(`logs:${PROJECT_ID}`,JSON.stringify({ log }));
}

async function init () {
    console.log('Executing script');
    publishLog('Build Started...');

    const outDirPath=path.join(__dirname, '..','output')

    const process=exec(`cd ${outDirPath} && npm install && npm run build`)

    process.stdout.on('data',function(data:Buffer){
        console.log(data.toString());
        publishLog(data.toString());
    })

    process.stdout.on('error',function(data:Buffer){
        console.log('Error',data.toString());
        publishLog(`Error: ${data.toString()}`);
    })

    process.on('close',async function(){
        console.log("Build Complete");
        publishLog('Build Completed')

        const distFolderPath = path.join(__dirname, '..', 'output', 'dist');
        const distFolderContents=fs.readdirSync(distFolderPath,{recursive:true})

        publishLog('Starting to upload...')
        for(const file of distFolderContents){
            const filePath=path.join(distFolderPath,file); 
            if(fs.lstatSync(filePath).isDirectory()){
                continue;
            }
            console.log('uploading',filePath);
            publishLog(`Uploading ${file}`);
            const command=new PutObjectCommand({
                Bucket: 'hostify',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            })

            await s3Client.send(command);
            console.log('uploaded',filePath);
            publishLog(`Uploaded ${file}`);
        }
        console.log('Done');
        publishLog(`Done 🎉`);

    })
}

init();
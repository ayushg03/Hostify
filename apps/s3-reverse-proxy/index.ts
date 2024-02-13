import express, { Request, Response } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import httpProxy from 'http-proxy';

const app = express();
const PORT: number = 8000;

const BASE_PATH: string = 'https://hostify.s3.ap-south-1.amazonaws.com/__outputs';

const proxy = httpProxy.createProxyServer();

app.use((req: Request, res: Response) => {
    const hostname: string = req.hostname;
    const subdomain: string = hostname.split('.')[0];

    // Custom Domain -DB Query
    const resolvesTo: string = `${BASE_PATH}/${subdomain}`;

    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on('proxyReq', (proxyReq, req: IncomingMessage, res: ServerResponse) => {
    const url: string = req.url || '';
    if (url === '/') {
        proxyReq.path += 'index.html';
    }
});

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`));

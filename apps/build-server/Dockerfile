FROM node:20

RUN apt-get update && apt-get install -y \
    git

WORKDIR /home/app

COPY main.sh main.sh
COPY script.ts script.ts
COPY package*.json .
COPY tsconfig.json .

RUN npm install typescript
RUN npm install
RUN npx tsc -b

RUN chmod +x main.sh
RUN chmod +x /home/app/dist/script.js

ENTRYPOINT [ "/home/app/main.sh" ]

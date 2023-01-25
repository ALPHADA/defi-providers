FROM --platform=linux/amd64 node:16.10.0-alpine as builder

RUN apk --no-cache upgrade && \
    apk --no-cache add curl unzip make protobuf-dev gcc g++ cmake python3 git protoc
RUN curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v3.14.0/protoc-3.14.0-linux-x86_64.zip
RUN unzip -o protoc-3.14.0-linux-x86_64.zip -d ./proto
RUN chmod 755 -R ./proto/bin
ENV BASE=/usr

RUN cp ./proto/bin/protoc ${BASE}/bin/
RUN cp -R ./proto/include/* ${BASE}/include/

WORKDIR /usr/src/app
COPY .git/ ./.git/
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM --platform=linux/amd64 node:16.10.0-alpine
WORKDIR /usr/src/app
COPY --from=builder . .
CMD [ "node", "dist/main.js" ]

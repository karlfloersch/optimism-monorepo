# 1492 GETH BUG


# How to rapidly test

Open two terminals. In the first we will build geth:
```
$ cd docker/geth # this is 
$ docker build .
$ # if you want to persist geth, make a directory `geth-data` which we'll mount
$ docker run -it -p 9545:9545 -v "$(pwd)"/geth-data:/root/.ethereum DOCKER_IMAGE
```

This terminal we can spin up a full node:

```
$ cd packages/rollup-full-node
$ mkdir data # making a data dir for our DBs
$ # now run the beastly command lol. I should have put it in a script:
$ env L2_RPC_SERVER_PORT=8545 \
L2_RPC_SERVER_HOST=127.0.0.1 \
L2_RPC_SERVER_PERSISTENT_DB_PATH=./data/full-node/level \
LOCAL_L1_NODE_PERSISTENT_DB_PATH=./data/l1-node \
DEBUG="debug*,info*,error*" \
yarn clean && yarn build && yarn server:fullnode
```

![](https://img.memecdn.com/the-wat-fish_o_1779059.jpg)


![](https://images-na.ssl-images-amazon.com/images/I/51TKoeQJ7QL.jpg)

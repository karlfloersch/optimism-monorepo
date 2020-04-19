#!/bin/sh
PRIVATE_KEY_PATH="${VOLUME_PATH}${PRIVATE_KEY_PATH_SUFFIX}"

echo "$PRIVATE_KEY" | sed 's/^0x//' > $PRIVATE_KEY_PATH

# ./parity --base-path $VOLUME_PATH --config="/home/parity/entrypoint.sh"  --jsonrpc-interface all --jsonrpc-hosts="all" --jsonrpc-port=$PORT --gasprice 0 -l error
./parity --config="/home/parity/config.toml" --chain="/home/parity/instant_seal.json" --jsonrpc-port=9545 --min-gas-price 0 -l trace --tx-queue-no-early-reject --tx-queue-mem-limit=50 --tx-gas-limit=9000000000 --tx-time-limit=10000000
# ./parity -h

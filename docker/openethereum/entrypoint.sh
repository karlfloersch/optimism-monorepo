#!/bin/sh
PRIVATE_KEY_PATH="${VOLUME_PATH}${PRIVATE_KEY_PATH_SUFFIX}"

echo "$PRIVATE_KEY" | sed 's/^0x//' > $PRIVATE_KEY_PATH

# ./parity --base-path $VOLUME_PATH --config="/home/parity/entrypoint.sh"  --jsonrpc-interface all --jsonrpc-hosts="all" --jsonrpc-port=$PORT --gasprice 0 -l error
./parity --config="/home/parity/config.toml" --jsonrpc-port=9545 --gasprice 0 -l trace

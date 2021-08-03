#!/bin/bash

if [[ $# -ge 4 ]]; then
    export API_USER=$1
    export API_PASS=$2
    export PASSWORD=$3
    export ETH_URL=$4
    # Skip parameters 1-4
    shift; shift; shift; shift;
    cdk deploy "$@"
    exit $?
else
    echo 1>&2 "Provided API_USER, API_PASS, PASSWORD and ETH_URL as first 4 args."
    echo 1>&2 "Ex: $(basename $BASH_SOURCE) 'user@domain.com' 'MySecretApiPASS' 'MyWalletPASS' 'wss://MyEthURL' kovan-node"
    exit 1
fi
#deploy_cdk.sh <api_user> <api_pass> <password> <eth_url> node-stack

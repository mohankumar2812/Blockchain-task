import { Web3 } from 'web3';
import dotenv from 'dotenv';
import { claimJson, contractAddr } from './contractDetails.js';
dotenv.config();

const httpService = new Web3(new Web3.providers.HttpProvider(process.env.HTTP_RPC));
const webSocket = new Web3(new Web3.providers.WebsocketProvider(process.env.WS_RPC));
const claimInstance = new httpService.eth.Contract(claimJson, contractAddr);

const GetEvents = async () => {

    let fromBlock = 37015339
    const toBlock = Number(await httpService.eth.getBlockNumber());

    while (fromBlock <= toBlock) {

        let temp = fromBlock + 10000
        claimInstance.getPastEvents(
            'ALLEVENTS', {
            fromBlock: fromBlock,
            toBlock: temp,
        }
        ).then(result => {

            for (let i = 0; i < result.length; i++) {

                if (result[i].event == 'WhitelistAdded') {

                    let eventData = {
                        TransactionHash: result[i].transactionHash,
                        BlockNumber: result[i].blockNumber,
                        Event: result[i].event,
                        Account: result[i].returnValues.Account,
                        Status: result[i].returnValues.Status,
                    }

                    console.log("WhitelistAdded ==> ", eventData);

                } else if (result[i].event == 'UserClaimed') {
                    let eventData = {
                        TransactionHash: result[i].transactionHash,
                        BlockNumber: result[i].blockNumber,
                        Event: result[i].event,
                        Account: result[i].returnValues.Account,
                        value: result[i].returnValues.Value,
                    }

                    console.log("UserClaimed ==> ", eventData);
                }

            }

        })

        fromBlock += 10000
    }

    const whiteListEvent = httpService.utils.sha3('WhitelistAdded(address,bool)');
    const claimEvent = httpService.utils.sha3('UserClaimed(address,uint256)');

    const listenEvent = await webSocket.eth.subscribe('logs', {
        address: [contractAddr]
    })

    listenEvent.on('data', (event) => {

        if (event.topics[0] == whiteListEvent) {

            const decodeLog = httpService.eth.abi.decodeLog(
                [{ type: "address", name: "Account", indexed: true }, { type: "bool", name: "Status", indexed: true }],
                event.data,
                [event.topics[1], event.topics[2]]
            )

            const eventData = {
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                eventName: "WhitelistAdded",
                Account: decodeLog.Account,
                Status: decodeLog.Status
            }

            console.log("whitelist ==> ", eventData)

        } else if (event.topics[0] == claimEvent) {

            const decodeLog = httpService.eth.abi.decodeLog(
                [{ type: "address", name: "Account", indexed: true }, { type: "uint256", name: "Value", indexed: true }],
                event.data,
                [event.topics[1], event.topics[2]]
            )

            const eventData = {
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                eventName: "UserClaimed",
                Account: decodeLog.Account,
                Value: decodeLog.Value
            }

            console.log("userclaim ==> : ", eventData);

        }

    })

}

GetEvents();


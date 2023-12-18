const { msg_type_url } = require('../config/index')

function getMessages(transaction) {
    const { from, to, amount, fee, type} = transaction
    let sendMsg = []
    switch (type) {
        case("SEND"): 
            sendMsg.push({
                typeUrl: msg_type_url.SEND,
                value: {
                    fromAddress: from,
                    toAddress: to,
                    amount: [...amount],
                },
            })

            return sendMsg
        
        case("MULTI_SEND"):
            for(let i = 0; i < amount.length; i++) {
                sendMsg.push({
                    typeUrl: msg_type_url.MULTI_SEND,
                    value: {
                        fromAddress: from,
                        toAddress: to,
                        amount: [amount[i]],
                    },
                })
            }

            return sendMsg
        
        case("DELEGATE"): 
            sendMsg.push({
                typeUrl: msg_type_url.DELEGATE,
                value: {
                    delegatorAddress: from,
                    validatorAddress: to,
                    amount: amount,
                },
            })

            return sendMsg

        case("UNDELEGATE"): 
            sendMsg.push({
                typeUrl: msg_type_url.UNDELEGATE,
                value: {
                    delegatorAddress: from,
                    validatorAddress: to,
                    amount: amount,
                },
            })

            return sendMsg

    }

}

module.exports = {getMessages}
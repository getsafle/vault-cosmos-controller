module.exports = {
    prefix: 'cosmos',
    msg_type_url : {
        "SEND": "/cosmos.bank.v1beta1.MsgSend",
        "MULTI_SEND": "/cosmos.bank.v1beta1.MsgMultiSend",
        "DELEGATE": "/cosmos.staking.v1beta1.MsgDelegate",
        "REDELEGATE": "/cosmos.staking.v1beta1.MsgBeginRedelegate",
        "UNDELEGATE": "/cosmos.staking.v1beta1.MsgUndelegate",
        "REWARD": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
        "VOTE": "/cosmos.gov.v1beta1.MsgVote",
        "IBC_TRANSFER": "/ibc.applications.transfer.v1.MsgTransfer"

    }
}
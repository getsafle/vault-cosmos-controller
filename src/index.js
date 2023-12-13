const { EventEmitter } = require('events')
const ObservableStore = require('obs-store')
const { prefix } = require('./config/index')
const { makeSignDoc ,DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing')
const crypto_1 = require("@cosmjs/crypto");
const encoding_1 = require("@cosmjs/encoding");
const amino_1 = require("@cosmjs/amino");
const { IndexedTx, StargateClient, SigningStargateClient } =  require("@cosmjs/stargate")
const tx_3 = require("cosmjs-types/cosmos/tx/v1beta1/tx");

class KeyringController extends EventEmitter {

    constructor(opts) {
        super()
        this.store = new ObservableStore({ mnemonic: opts.mnemonic})
        this.importedWallets = []
    }

    async generateWallet() {
        const { mnemonic } = this.store.getState();
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic)
        this.updatePersistentStore({ wallet: wallet })
        return wallet
    }

    async getAccounts() {
        const { wallet } = this.store.getState();
        const WalletAccounts = await wallet.getAccounts()
        let accounts = []
        WalletAccounts.map((account) => {
            accounts.push(account.address)
        })
        return accounts
    }

    async addAccounts() {
        const { mnemonic } = this.store.getState();
        const noOfAccounts = (await this.getAccounts()).length
        const hdPaths = this.makeHDPaths(noOfAccounts)
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { hdPaths: hdPaths })
        this.updatePersistentStore({ wallet: wallet })
        let accounts = await this.getAccounts()
        return accounts.pop()
    }

    makeHDPaths(noOfAccounts) {
        const hdPaths = []
        for (let index = 0; index < noOfAccounts + 1; index++) {
            hdPaths.push((0, amino_1.makeCosmoshubPath)(index)) 
        }
        return hdPaths 
    }

    async exportPrivateKey(_address) {
        const { wallet } = this.store.getState();
        const accounts = await wallet.getAccountsWithPrivkeys();
        const account = accounts.find((account) => account.address === _address)
        const pkey = Buffer.from(account.privkey).toString('hex');
        return pkey
    }

    async importWallet(_privateKey) {
        const pkeyBuffer = Uint8Array.from(Buffer.from(_privateKey, 'hex'))
        const { pubkey } = await crypto_1.Secp256k1.makeKeypair(pkeyBuffer);
        const publicKey = crypto_1.Secp256k1.compressPubkey(pubkey)
        const address = (0, encoding_1.toBech32)(prefix, (0, amino_1.rawSecp256k1PubkeyToRawAddress)(publicKey));
        this.importedWallets.push(address);
        return address
    }
    
    async signTransaction(transaction, rpcUrl) {
        const { wallet } = this.store.getState();
        const { from, to, amount, fee} = transaction
        const signingClient = await SigningStargateClient.connectWithSigner(rpcUrl, wallet);

        const sendMsg = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
                fromAddress: from,
                toAddress: to,
                amount: [...amount],
            },
        };

        const txRaw = await signingClient.sign(from, [sendMsg], fee, "sign sending uatom");
        console.log("signedTx = ", txRaw);
        return txRaw

    }

    async sendTransaction(rawTx, rpcUrl) {
        const { wallet } = this.store.getState();
        const signingClient = await SigningStargateClient.connectWithSigner(rpcUrl, wallet);
        
        const txBytes = tx_3.TxRaw.encode(rawTx).finish();
        console.log("txBytes = ", txBytes);

        const response = signingClient.broadcastTx(txBytes);
        return response

    }

    async getFees(transaction, rpcUrl) {
        const { wallet } = this.store.getState();
        const { from, to, amount, fee} = transaction
        const sendMsg = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
                fromAddress: from,
                toAddress: to,
                amount: [...amount],
            },
        };

        let memo = "sign sending uatom"
        const signingClient = await SigningStargateClient.connectWithSigner(rpcUrl, wallet);
        const gasEstimation = await signingClient.simulate(from, [sendMsg], memo);
        return gasEstimation
    }

    updatePersistentStore(obj) {
        this.store.updateState(obj)
        return true
    }

}

const getBalance = async (address, rpc) => {
    const client = await StargateClient.connect(rpc)
    const balances = await client.getAllBalances(address) // denom: uatom
    return balances[0].amount
}

module.exports = { KeyringController, getBalance }

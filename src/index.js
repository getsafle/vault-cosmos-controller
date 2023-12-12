const { EventEmitter } = require('events')
const ObservableStore = require('obs-store')
const { prefix } = require('./config/index')
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing')
const crypto_1 = require("@cosmjs/crypto");
const encoding_1 = require("@cosmjs/encoding");
const amino_1 = require("@cosmjs/amino");


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

    updatePersistentStore(obj) {
        this.store.updateState(obj)
        return true
    }

}

module.exports = { KeyringController }

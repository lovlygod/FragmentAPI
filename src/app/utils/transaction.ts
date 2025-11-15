import { TonapiClient, WalletV5R1, TransferMessage } from 'tonutils';

export class TransactionProcessor {
  private config: Record<string, string>;
  private cleanDecodeFunc: (s: string) => string;

  constructor(config: Record<string, string>, cleanDecodeFunc: (s: string) => string) {
    this.config = config;
    this.cleanDecodeFunc = cleanDecodeFunc;
  }

  public async processTransaction(transactionData: Record<string, any>): Promise<[boolean, string | null, string | null]> {
    if (!transactionData.transaction || !transactionData.transaction.messages) {
      return [false, 'Invalid transaction', null];
    }

    const client = new TonapiClient({ apiKey: this.config['api_key'], isTestnet: false });
    const [wallet] = await WalletV5R1.fromMnemonic({ client, mnemonic: this.config['seed'] });

    try {
      const message = transactionData.transaction.messages[0];
      const payload = this.cleanDecodeFunc(message.payload);

      const messages = [new TransferMessage({
        destination: message.address,
        amount: parseInt(message.amount) / 1000000000,
        body: payload
      })];

      const txHash = await wallet.batchTransferMessages({ messages });
      return [true, null, txHash];
    } catch (e) {
      return [false, e instanceof Error ? e.message : String(e), null];
    }
  }
}
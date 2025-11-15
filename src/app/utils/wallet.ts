import { HTTPClient } from 'tonutils';
import { TransactionProcessor } from './transaction';

export class WalletLinker {
  private config: Record<string, string>;
  private headers: Record<string, string>;
  private transactionProcessor: TransactionProcessor;

  constructor(config: Record<string, string>, headers: Record<string, string>, transactionProcessor: TransactionProcessor) {
    this.config = config;
    this.headers = headers;
    this.transactionProcessor = transactionProcessor;
  }

  public async linkWallet(account: Record<string, any>): Promise<boolean> {
    const httpClient = new HTTPClient();
    
    const data = {
      account: account,
      device: "iPhone15,2",
      method: 'linkWallet'
    };

    const response = await httpClient.post(`https://fragment.com/api?hash=${this.config['hash']}`, {
      headers: this.headers,
      data: data
    });
    
    const result = await response.json();

    if (result.ok) {
      return true;
    }

    if (result.transaction) {
      const [success, _, __] = await this.transactionProcessor.processTransaction(result);
      return success;
    }

    return false;
  }
}
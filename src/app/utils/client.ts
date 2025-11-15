import { Config } from '../core/config';
import { WalletLinker } from './wallet';
import { HTTPClient } from 'tonutils';

export class ApiClient {
  private config: Record<string, string>;
  private headers: Record<string, string>;
  private walletLinker: WalletLinker;

  constructor(config: Record<string, string>, headers: Record<string, string>, walletLinker: WalletLinker) {
    this.config = config;
    this.headers = headers;
    this.walletLinker = walletLinker;
  }

  public async executeTransactionRequest(txData: Record<string, any>, account: Record<string, any>): Promise<[boolean, Record<string, any>]> {
    const httpClient = new HTTPClient();
    
    let response = await httpClient.post(`https://fragment.com/api?hash=${this.config['hash']}`, {
      headers: this.headers,
      data: txData
    });
    
    let transaction = await response.json();
    
    if (transaction.need_verify) {
      const walletLinked = await this.walletLinker.linkWallet(account);
      if (!walletLinked) {
        return [false, { success: false, error: 'Failed to link wallet' }];
      }
      
      response = await httpClient.post(`https://fragment.com/api?hash=${this.config['hash']}`, {
        headers: this.headers,
        data: txData
      });
      transaction = await response.json();
    }
    
    return [true, transaction];
  }
}
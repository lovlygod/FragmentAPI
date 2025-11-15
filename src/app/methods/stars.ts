import { TonapiClient, WalletV5R1 } from 'tonutils';
import { Config } from '../core/config';
import { TransactionProcessor } from '../utils/transaction';
import { WalletLinker } from '../utils/wallet';
import { ApiClient } from '../utils/client';
import * as http from 'http';

export class FragmentStars {
  private config: Record<string, string>;
  private headers: Record<string, string>;
  private transactionProcessor: TransactionProcessor;
  private walletLinker: WalletLinker;
  private apiClient: ApiClient;

  constructor() {
    const configReader = new Config();
    this.config = configReader.getConfig();

    this.headers = {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'en-US,en;q=0.9,uk;q=0.8,ru;q=0.7',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'cookie': this.config['cookies'],
      'origin': 'https://fragment.com',
      'referer': 'https://fragment.com/stars/buy',
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      'x-requested-with': 'XMLHttpRequest'
    };

    this.transactionProcessor = new TransactionProcessor(this.config, this._cleanDecode);
    this.walletLinker = new WalletLinker(this.config, this.headers, this.transactionProcessor);
    this.apiClient = new ApiClient(this.config, this.headers, this.walletLinker);
  }

  private _cleanDecode(s: string): string {
    const base64Cleaned = s.replace(/[^A-Za-z0-9+/=]/g, '') + '='.repeat((-s.length % 4));
    const b = Buffer.from(base64Cleaned, 'base64');
    const t = b.toString('utf-8');
    const match = t.match(/(\d+\s+Telegram\s+Stars.*?Ref#[A-Za-z0-9]+)/);
    return match ? match[1].trim() : t.trim();
  }

  private async _getAccountInfo(): Promise<Record<string, any>> {
    const client = new TonapiClient({ apiKey: this.config['api_key'], isTestnet: false });
    const [wallet, pubKey] = await WalletV5R1.fromMnemonic({ client, mnemonic: this.config['seed'] });
    const boc = wallet.stateInit.serialize().toBoc();

    return {
      "address": wallet.address.toStr(false, false),
      "publicKey": pubKey.toString('hex'),
      "chain": "-239",
      "walletStateInit": boc.toString('base64')
    };
  }

  public async buyStars(username: string, amount: number): Promise<Record<string, any>> {
    if (amount < 50) {
      return { success: false, error: "Minimum amount is 50 stars" };
    }

    const account = await this._getAccountInfo();

    const searchData = `query=${encodeURIComponent(username)}&quantity=&method=searchStarsRecipient`;
    const searchResp = await this._makeRequest(searchData);
    const searchResult = JSON.parse(searchResp);

    const recipient = searchResult.found?.recipient;
    if (!recipient) {
      return { success: false, error: "User not found" };
    }

    const initData = `recipient=${recipient}&quantity=${amount}&method=initBuyStarsRequest`;
    const initResp = await this._makeRequest(initData);
    const initResult = JSON.parse(initResp);

    const reqId = initResult.req_id;
    if (!reqId) {
      return { success: false, error: "Failed to initialize purchase" };
    }

    const txData = {
      'account': account,
      'device': "iPhone15,2",
      'transaction': 1,
      'id': reqId,
      'show_sender': 0,
      'method': 'getBuyStarsLink'
    };

    const [requestSuccess, transactionResult] = await this.apiClient.executeTransactionRequest(txData, account);

    if (!requestSuccess) {
      return transactionResult;
    }

    const [success, error, txHash] = await this.transactionProcessor.processTransaction(transactionResult);

    if (success) {
      return {
        success: true,
        data: {
          transaction_id: txHash,
          username: username,
          amount: amount,
          timestamp: Math.floor(Date.now() / 1000)
        }
      };
    }

    return { success: false, error: error || "Unknown error" };
  }

  private _makeRequest(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'fragment.com',
        port: 443,
        path: `/api?hash=${this.config['hash']}`,
        method: 'POST',
        headers: {
          ...this.headers,
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res: http.IncomingMessage) => {
        let data = '';
        res.on('data', (chunk: any) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (error: Error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }
}
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'midtrans-client' {
  interface CoreApiOptions {
    isProduction: boolean;
    serverKey: string | undefined;
    clientKey: string | undefined;
  }

  interface ChargeRequest {
    payment_type: string;
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    [key: string]: any;
  }

  interface ChargeResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
    [key: string]: any;
  }

  class CoreApi {
    constructor(options: CoreApiOptions);
    charge(parameter: ChargeRequest): Promise<ChargeResponse>;
    capture(parameter: any): Promise<any>;
    cardToken(parameter: any): Promise<any>;
    cardPointInquiry(tokenId: string): Promise<any>;
    getTransactionStatus(transactionId: string): Promise<any>;
    getTransactionStatusB2b(transactionId: string): Promise<any>;
    approveTransaction(transactionId: string): Promise<any>;
    denyTransaction(transactionId: string): Promise<any>;
    cancelTransaction(transactionId: string): Promise<any>;
    expireTransaction(transactionId: string): Promise<any>;
    refund(transactionId: string, parameter?: any): Promise<any>;
    refundDirect(transactionId: string, parameter?: any): Promise<any>;
    directBankTransfer(parameter: any): Promise<any>;
    createSubscription(parameter: any): Promise<any>;
    getSubscription(subscriptionId: string): Promise<any>;
    disableSubscription(subscriptionId: string): Promise<any>;
    enableSubscription(subscriptionId: string): Promise<any>;
    updateSubscription(subscriptionId: string, parameter: any): Promise<any>;
    linkPaymentAccount(parameter: any): Promise<any>;
    getPaymentAccount(accountId: string): Promise<any>;
    unlinkPaymentAccount(accountId: string): Promise<any>;
    createPaymentWithToken(parameter: any): Promise<any>;
    ping(): Promise<any>;
  }

  class Snap {
    constructor(options: CoreApiOptions);
    createTransaction(parameter: any): Promise<any>;
    createTransactionToken(parameter: any): Promise<any>;
    createTransactionRedirectUrl(parameter: any): Promise<any>;
    ping(): Promise<any>;
  }

  class Transaction {
    static status(transactionId: string, options: CoreApiOptions): Promise<any>;
    static statusb2b(transactionId: string, options: CoreApiOptions): Promise<any>;
    static approve(transactionId: string, options: CoreApiOptions): Promise<any>;
    static deny(transactionId: string, options: CoreApiOptions): Promise<any>;
    static cancel(transactionId: string, options: CoreApiOptions): Promise<any>;
    static expire(transactionId: string, options: CoreApiOptions): Promise<any>;
    static refund(transactionId: string, options: CoreApiOptions, parameter?: any): Promise<any>;
    static refundDirect(
      transactionId: string,
      options: CoreApiOptions,
      parameter?: any,
    ): Promise<any>;
  }

  export default {
    CoreApi,
    Snap,
    Transaction,
  };
}

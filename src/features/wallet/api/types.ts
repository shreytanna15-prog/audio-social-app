export type CoinTransactionType = 'CONTEST_REWARD' | 'ADMIN_GRANT';

export type CoinTransactionDto = {
  id: string;
  amount: number;
  balanceAfter: number;
  type: CoinTransactionType;
  description: string;
  referenceId: string | null;
  createdAt: string;
};

export type WalletDto = {
  balance: number;
  transactions: CoinTransactionDto[];
  nextCursor: string | null;
};

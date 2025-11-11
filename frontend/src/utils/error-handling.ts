import { BaseError, ContractFunctionRevertedError } from 'viem';

interface ParsedError {
  title: string;
  message: string;
  code?: string;
}

export function parseContractError(error: unknown): ParsedError {
  if (error instanceof BaseError) {
    const revertError = error.walk((err) => err instanceof ContractFunctionRevertedError);
    
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? '';
      
      return {
        title: 'Transaction Failed',
        message: getContractErrorMessage(errorName),
        code: errorName,
      };
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('User rejected')) {
      return {
        title: 'Transaction Rejected',
        message: 'You rejected the transaction in your wallet.',
      };
    }

    if (error.message.includes('insufficient funds')) {
      return {
        title: 'Insufficient Funds',
        message: 'You do not have enough STT to complete this transaction.',
      };
    }

    if (error.message.includes('nonce too low')) {
      return {
        title: 'Transaction Error',
        message: 'Transaction nonce is too low. Please try again.',
      };
    }

    if (error.message.includes('gas required exceeds')) {
      return {
        title: 'Gas Error',
        message: 'Transaction requires more gas than available.',
      };
    }
  }

  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
  };
}

function getContractErrorMessage(errorName: string): string {
  const errorMessages: Record<string, string> = {
    UsernameAlreadyExists: 'This username is already taken. Please choose another.',
    ProfileNotFound: 'This profile does not exist.',
    InsufficientBalance: 'You do not have enough balance to complete this action.',
    InvalidAmount: 'The amount provided is invalid.',
    UnauthorizedAccess: 'You are not authorized to perform this action.',
    TransferFailed: 'The transfer failed. Please try again.',
    InvalidRecipient: 'The recipient address is invalid.',
    TipToSelf: 'You cannot tip yourself.',
    ZeroAmount: 'Amount must be greater than zero.',
    MaxTipExceeded: 'Tip amount exceeds the maximum allowed.',
    WithdrawalFailed: 'Withdrawal failed. Please try again.',
    ContractPaused: 'The contract is currently paused. Please try again later.',
  };

  return errorMessages[errorName] || `Contract error: ${errorName}`;
}

export function getUserFriendlyMessage(error: unknown): string {
  const parsed = parseContractError(error);
  return parsed.message;
}

export function isUserRejectionError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('User rejected') ||
      error.message.includes('user rejected') ||
      error.message.includes('User denied')
    );
  }
  return false;
}

export function isInsufficientFundsError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('insufficient funds') ||
      error.message.includes('InsufficientBalance')
    );
  }
  return false;
}

export function formatErrorForLogging(error: unknown): string {
  if (error instanceof Error) {
    return JSON.stringify(
      {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      null,
      2
    );
  }

  return String(error);
}

export class AppError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 503);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

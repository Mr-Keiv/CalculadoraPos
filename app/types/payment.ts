export interface MobilePaymentOption {
  id: string;
  phoneNumber: string;
  bankName?: string;
  ownerName?: string;
  cedula?: string;
}

export interface BankTransferOption {
  bankName: string;
  accountNumber: string;
  ownerName: string;
  cedula: string;
}

export interface ZelleOption {
  ownerName: string;
  email: string;
}

export interface PaymentContextType {
  amount: number;
  setAmount: (amount: number) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  mobilePaymentOptions: MobilePaymentOption[];
  updateMobilePaymentOption: (option: MobilePaymentOption) => void;
  removeMobilePaymentOption: (id: string) => void;
  addMobilePaymentOption: () => void;
  bankTransfer: BankTransferOption;
  updateBankTransfer: (option: BankTransferOption) => void;
  zelle: ZelleOption;
  updateZelle: (option: ZelleOption) => void;
}
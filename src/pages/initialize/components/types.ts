export interface InitDraft {
  accountName: string;
  oldPassword: string;
  newPassword: string;
  siteTitle: string;
  siteDesc: string;
  siteLogo: string;
  aiProvider: string;
  aiModel: string;
  aiPrompt: string;
  storageType: string;
  storageBucket: string;
  storageDomain: string;
  securityCaptcha: boolean;
  securityRateLimit: boolean;
}

export type UpdateDraft = (updater: (prev: InitDraft) => InitDraft) => void;

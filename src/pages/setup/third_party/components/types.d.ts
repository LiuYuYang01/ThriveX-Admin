import { Config } from '@/types/app/config';

export interface ThirdPartyFormProps {
  row: Config | undefined;
  onSaved: () => void;
}

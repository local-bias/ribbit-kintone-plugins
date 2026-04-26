import { useAtomValue } from 'jotai';
import { isConditionIdUnselectedAtom } from '@/config/states/plugin';
import AssistantForm from './form-assistants';
import CommonForm from './form-common';

export default function ConfigForm() {
  const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return commonSettingsShown ? <CommonForm /> : <AssistantForm />;
}

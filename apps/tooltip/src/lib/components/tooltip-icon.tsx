import { IconType } from '@/schema/plugin-config';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';

type Props = { iconType: IconType; iconColor: string; };

export function TooltipIcon({ iconType, iconColor }: Props) {
  switch (iconType) {
    case 'warning':
      return (
        <ExclamationCircleIcon
          className='w-6 h-6 transition-all rad:w-6 rad:h-6 rad:transition-all'
          fill={iconColor}
        />
      );
    case 'error':
      return (
        <ExclamationTriangleIcon
          className='w-6 h-6 transition-all rad:w-6 rad:h-6 rad:transition-all'
          fill={iconColor}
        />
      );
    case 'success':
      return (
        <CheckCircleIcon
          className='w-6 h-6 transition-all rad:w-6 rad:h-6 rad:transition-all'
          fill={iconColor}
        />
      );
    case 'info':
    default:
      return (
        <InformationCircleIcon
          className='w-6 h-6 transition-all rad:w-6 rad:h-6 rad:transition-all'
          fill={iconColor}
        />
      );
  }
}

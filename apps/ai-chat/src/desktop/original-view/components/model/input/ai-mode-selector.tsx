import {
  allowImageGenerationAtom,
  allowWebSearchAtom,
  imageGenerationEnabledAtom,
  webSearchEnabledAtom,
} from '@/desktop/original-view/states/states';
import { FormControl, MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { GlobeIcon, ImageIcon, MessageSquareIcon } from 'lucide-react';
import { useMemo } from 'react';

type AIMode = 'standard' | 'web-search' | 'image-generation';

const MODE_OPTIONS: { value: AIMode; label: string; icon: React.ReactNode }[] = [
  { value: 'standard', label: '通常', icon: <MessageSquareIcon className='rad:w-4 rad:h-4' /> },
  {
    value: 'web-search',
    label: '最新の情報を検索',
    icon: <GlobeIcon className='rad:w-4 rad:h-4' />,
  },
  {
    value: 'image-generation',
    label: '画像生成',
    icon: <ImageIcon className='rad:w-4 rad:h-4' />,
  },
];

export default function AIModeSelector() {
  const allowWebSearch = useAtomValue(allowWebSearchAtom);
  const allowImageGeneration = useAtomValue(allowImageGenerationAtom);
  const [webSearchEnabled, setWebSearchEnabled] = useAtom(webSearchEnabledAtom);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useAtom(imageGenerationEnabledAtom);

  const availableOptions = useMemo(() => {
    return MODE_OPTIONS.filter((option) => {
      if (option.value === 'web-search') return allowWebSearch;
      if (option.value === 'image-generation') return allowImageGeneration;
      return true;
    });
  }, [allowWebSearch, allowImageGeneration]);

  // 選択肢が「通常」のみの場合は何も表示しない
  if (availableOptions.length <= 1) {
    return null;
  }

  const currentMode: AIMode = webSearchEnabled
    ? 'web-search'
    : imageGenerationEnabled
    ? 'image-generation'
    : 'standard';

  const handleChange = (event: SelectChangeEvent<AIMode>) => {
    const newMode = event.target.value as AIMode;

    // すべてのモードをリセットしてから選択されたモードを有効化
    setWebSearchEnabled(false);
    setImageGenerationEnabled(false);

    switch (newMode) {
      case 'web-search':
        setWebSearchEnabled(true);
        break;
      case 'image-generation':
        setImageGenerationEnabled(true);
        break;
      case 'standard':
      default:
        break;
    }
  };

  const selectedOption = availableOptions.find((opt) => opt.value === currentMode);

  return (
    <FormControl size='small'>
      <Select<AIMode>
        value={currentMode}
        onChange={handleChange}
        displayEmpty
        sx={{
          fontSize: '0.75rem',
          minWidth: 120,
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '4px 8px',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.15)',
          },
        }}
        renderValue={() => (
          <div className='rad:flex rad:items-center rad:gap-1.5'>
            {selectedOption?.icon}
            <span>{selectedOption?.label}</span>
          </div>
        )}
      >
        {availableOptions.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {option.icon}
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

import { getConditionPropertyAtom } from '@/config/states/plugin';
import { getAllApps } from '@konomi-app/kintone-utilities';
import { CircularProgress, FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useAtom } from 'jotai';
import { FC, useEffect, useState } from 'react';

interface AppInfo {
  appId: string;
  name: string;
}

/**
 * アプリ選択セレクトボックス
 */
const AppSelector: FC = () => {
  const [appId, setAppId] = useAtom(getConditionPropertyAtom('appId'));
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setIsLoading(true);
        const fetchedApps = await getAllApps();
        setApps(fetchedApps);
      } catch (error) {
        console.error('アプリ一覧の取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, []);

  const handleChange = (event: SelectChangeEvent) => {
    setAppId(event.target.value);
  };

  if (isLoading) {
    return <CircularProgress size={24} />;
  }

  return (
    <FormControl fullWidth>
      <Select value={appId} onChange={handleChange} displayEmpty>
        <MenuItem value='' disabled>
          アプリを選択してください
        </MenuItem>
        {apps.map((app) => (
          <MenuItem key={app.appId} value={String(app.appId)}>
            {app.name} (ID: {app.appId})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default AppSelector;

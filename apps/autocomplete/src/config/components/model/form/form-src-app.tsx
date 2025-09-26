import { Autocomplete, Box, Skeleton, TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { kintoneAppsAtom } from '../../../states/kintone';
import { handleSrcAppChangeAtom, srcAppIdAtom } from '../../../states/plugin';
import { t } from '@/lib/i18n';

function SrcAppFormComponent() {
  const allApps = useAtomValue(kintoneAppsAtom);
  const srcAppId = useAtomValue(srcAppIdAtom);
  const onAppChange = useSetAtom(handleSrcAppChangeAtom);

  return (
    <Autocomplete
      value={allApps.find((app) => app.appId === srcAppId) ?? null}
      sx={{ width: '350px' }}
      options={allApps}
      isOptionEqualToValue={(option, v) => option.appId === v.appId}
      getOptionLabel={(app) => `${app.name}(id: ${app.appId})`}
      onChange={(_, app) => onAppChange(app?.appId ?? '')}
      renderOption={(props, app) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component='li' {...optionProps}>
            <div className='grid'>
              <div className='text-xs text-gray-400'>
                id: {app.code}
                {app.appId}
              </div>
              {app.name}
            </div>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label={t('config.condition.srcAppId.label')} variant='outlined' color='primary' />
      )}
    />
  );
}

function SrcAppForm() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <TextField
          error
          label={t('config.condition.srcAppId.label')}
          variant='outlined'
          color='primary'
          helperText={`アプリ情報の取得に失敗しました: ${error.message}`}
        />
      )}
    >
      <Suspense fallback={<Skeleton variant='rounded' width={350} height={56} />}>
        <SrcAppFormComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

export default SrcAppForm;

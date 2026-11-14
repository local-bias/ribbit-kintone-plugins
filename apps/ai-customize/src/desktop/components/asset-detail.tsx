import { Alert, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAtomValue } from '@repo/jotai';
import { type ReactNode, useMemo } from 'react';
import { NO_ACCESS } from '@/lib/asset-access';
import { type AssetUsage, listAssetUsage, listUrlLiterals } from '@/lib/asset-usage';
import { groupDenials } from '@/lib/diagnostics';
import { t } from '@/lib/i18n';
import type { Asset, AssetScreen } from '@/schema/asset';
import { describeDiagnostic, describeOperation } from '../diagnostic-text';
import {
  panelAccessAtom,
  panelAssetsAtom,
  runtimeViewAtom,
  servicesAtom,
} from '../states/launcher';
import { AssetActions } from './asset-actions';
import { assetTitle } from './asset-labels';
import { CodeEditor } from './code-editor';
import { CodeView } from './code-view';
import { PERMISSIONS_SECTION_ID, PermissionSection } from './permission-section';
import { ScopeControl } from './scope-control';
import { useUnsavedGuard } from './use-unsaved-guard';

const Root = styled('div')({ display: 'grid', gap: 16, padding: 16 });

const Heading = styled('h3')({ margin: 0, fontSize: 15, overflowWrap: 'anywhere' });

const Section = styled('section')(({ theme }) => ({
  display: 'grid',
  gap: 6,
  '& h4': { margin: 0, fontSize: 13, color: theme.palette.text.secondary },
  '& ul': { margin: 0, paddingLeft: 20 },
}));

const Fields = styled('dl')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  gap: '4px 12px',
  margin: 0,
  '& dt': { color: theme.palette.text.secondary },
  '& dd': { margin: 0, overflowWrap: 'anywhere' },
}));

const SCREEN_KEYS: Record<AssetScreen, Parameters<typeof t>[0]> = {
  index: 'desktop.detail.screen.index',
  detail: 'desktop.detail.screen.detail',
  create: 'desktop.detail.screen.create',
  edit: 'desktop.detail.screen.edit',
};

const describeUsage = (usage: AssetUsage): string => {
  switch (usage.type) {
    case 'api':
      return usage.requirements === null || usage.method === 'unknown'
        ? t('desktop.detail.usage.apiUnknown', String(usage.line))
        : t('desktop.detail.usage.api', usage.method, String(usage.line));
    case 'proxy':
      return t(
        'desktop.detail.usage.proxy',
        usage.target ?? t('desktop.detail.usage.dynamic'),
        String(usage.line)
      );
    case 'resource':
      return t(
        'desktop.detail.usage.resource',
        usage.target ?? t('desktop.detail.usage.dynamic'),
        String(usage.line)
      );
    case 'bypass':
      return t('desktop.detail.usage.bypass', usage.pattern, String(usage.line));
  }
};

/** アセットの定義(説明・影響範囲・実行順・適用画面) */
function Definition(props: { asset: Asset; scope: ReactNode }) {
  const { asset } = props;
  const rows: [string, ReactNode][] = [
    [t('desktop.detail.description'), asset.description || '—'],
    [t('desktop.detail.scope'), props.scope],
    [t('desktop.detail.order'), String(asset.order)],
    [
      t('desktop.detail.screens'),
      asset.screens.length === 0
        ? t('desktop.detail.screens.all')
        : asset.screens.map((screen) => t(SCREEN_KEYS[screen])).join(', '),
    ],
  ];
  return (
    <Fields>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'contents' }}>
          <dt>{label}</dt>
          <dd style={{ whiteSpace: 'pre-line' }}>{value}</dd>
        </div>
      ))}
    </Fields>
  );
}

/** 管理アプリ側の設定の不備(無効な通信先など) */
function ConfigurationWarnings(props: { asset: Asset }) {
  const { asset } = props;
  const messages = [
    ...asset.invalidExternalUrls.map(({ line, reason }) =>
      t('desktop.detail.invalidExternal', String(line), t(`desktop.urls.error.${reason}`))
    ),
    ...asset.externalUrlWarnings.map(({ line }) =>
      t('desktop.detail.insecureExternal', String(line))
    ),
    ...asset.configurationIssues.map(() => t('desktop.detail.conflictingExternal')),
  ];
  return messages.length === 0 ? null : (
    <Alert severity='warning'>
      {messages.map((message) => (
        <div key={message}>{message}</div>
      ))}
    </Alert>
  );
}

const focusPermissions = () => {
  const section = document.getElementById(PERMISSIONS_SECTION_ID);
  section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  section?.querySelector<HTMLElement>('input:not([disabled]), button:not([disabled])')?.focus({
    preventScroll: true,
  });
};

/** このページで起きたこと(止めた操作は同じ内容をまとめて件数にする) */
function Problems(props: { assetId: string; canEditPermissions: boolean }) {
  const view = useAtomValue(runtimeViewAtom);
  const denials = groupDenials(view.diagnostics, props.assetId);
  const others = view.diagnostics
    .filter(
      (entry) =>
        'assetId' in entry && entry.assetId === props.assetId && entry.kind !== 'slow-evaluation'
    )
    .map(describeDiagnostic)
    .filter((message): message is string => message !== null);
  const messages = [
    ...new Set(others),
    ...denials.map(({ denial, count }) =>
      t('desktop.detail.denied', describeOperation(denial), String(count))
    ),
  ];
  if (messages.length === 0) return null;
  return (
    <Section>
      <h4>{t('desktop.detail.problems')}</h4>
      <Alert
        severity='error'
        action={
          // 拒否をきっかけにコードを見ずに許可する流れを作らないよう、その場では付与せず権限の欄へ移るだけ
          props.canEditPermissions && denials.length > 0 ? (
            <Button color='inherit' size='small' onClick={focusPermissions}>
              {t('desktop.detail.checkPermissions')}
            </Button>
          ) : undefined
        }
      >
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </Alert>
    </Section>
  );
}

/**
 * アセットの詳細(定義・権限・コードの中の使用箇所・このページで起きたこと・コード)
 *
 * 操作はUI要素ごとに、書き込むフィールドのアクセス権で活性を決める(docs/06-ui.md 5章の表)
 *
 * @see docs/06-ui.md 5章「詳細(コード表示)」「権限(カスタマイズ単位)」
 */
export function AssetDetail(props: { assetId: string; onBack: () => void }) {
  const assets = useAtomValue(panelAssetsAtom);
  const accessMap = useAtomValue(panelAccessAtom);
  const services = useAtomValue(servicesAtom);
  const guardUnsaved = useUnsavedGuard();
  const asset = assets.find((item) => item.asset.id === props.assetId)?.asset;
  const usage = useMemo(() => (asset ? listAssetUsage(asset, location.origin) : []), [asset]);
  const urlLiterals = useMemo(() => (asset ? listUrlLiterals(asset) : []), [asset]);

  if (services === null) {
    return null;
  }
  if (asset === undefined) {
    // 他の人が削除した・見えなくなった
    return (
      <Root>
        <span>{t('desktop.detail.notFound')}</span>
        <Button size='small' onClick={() => guardUnsaved() && props.onBack()}>
          ← {t('desktop.detail.back')}
        </Button>
      </Root>
    );
  }
  const access = accessMap.get(asset.id) ?? NO_ACCESS;
  return (
    <Root>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <Button size='small' onClick={() => guardUnsaved() && props.onBack()}>
          ← {t('desktop.detail.back')}
        </Button>
        <Button
          size='small'
          href={services.recordPath(asset.id)}
          target='_blank'
          rel='noopener noreferrer'
        >
          {t('desktop.detail.openRecord')}
        </Button>
      </div>
      <Heading>
        {assetTitle(asset)} <small>#{asset.id}</small>
      </Heading>
      <Definition
        asset={asset}
        scope={<ScopeControl asset={asset} access={access} usage={usage} />}
      />
      <ConfigurationWarnings asset={asset} />
      <Problems assetId={asset.id} canEditPermissions={access.canEditPermissions} />
      <Section>
        <h4>{t('desktop.perm.title')}</h4>
        <PermissionSection asset={asset} access={access} usage={usage} />
      </Section>
      <Section>
        <h4>{t('desktop.detail.usage')}</h4>
        {usage.length === 0 ? (
          <span>{t('desktop.detail.usage.none')}</span>
        ) : (
          <ul>
            {usage.map((item, index) => (
              // 同じ行に同じ呼び出しが並ぶこともあるため、並び順で識別する(並べ替えない)
              // biome-ignore lint/suspicious/noArrayIndexKey: 行番号順に並べた一覧で、並びは変わらない
              <li key={index}>{describeUsage(item)}</li>
            ))}
          </ul>
        )}
      </Section>
      {urlLiterals.length > 0 && (
        <Section>
          <h4>{t('desktop.detail.urlLiterals')}</h4>
          <span>{t('desktop.detail.urlLiteralsNote')}</span>
          <ul>
            {urlLiterals.map(({ url, line }, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: 行番号順に並べた一覧で、並びは変わらない
              <li key={index} style={{ overflowWrap: 'anywhere' }}>
                {t('desktop.detail.urlLiteral', url, String(line))}
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section>
        <h4>{t('desktop.detail.code')}</h4>
        {access.canEditCode ? (
          <CodeEditor asset={asset} label={t('desktop.detail.code')} />
        ) : (
          <>
            <CodeView code={asset.code} label={t('desktop.detail.code')} />
            <span>{t('desktop.detail.readOnly')}</span>
          </>
        )}
      </Section>
      <AssetActions asset={asset} access={access} />
    </Root>
  );
}

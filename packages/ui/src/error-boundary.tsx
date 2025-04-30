import styled from '@emotion/styled';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { Alert, AlertTitle, Button } from '@mui/material';
import { URL_INQUIRY } from '@repo/constants';
import { PropsWithChildren, useState } from 'react';
import { FallbackProps, ErrorBoundary as PrimitiveErrorBoundary } from 'react-error-boundary';

type FallbackComponentProps = FallbackProps & {
  className?: string;
  config: Plugin.Meta.Config;
};

function ErrorFallbackComponent(props: FallbackComponentProps) {
  const { error, resetErrorBoundary, className, config } = props;
  const [loading, setLoading] = useState(false);

  const onRetry = () => {
    setLoading(true);
    setTimeout(() => {
      resetErrorBoundary();
      setLoading(false);
    }, 2000);
  };

  if (loading) {
    return <LoaderWithLabel label='再試行中' />;
  }

  return (
    <div className={className}>
      <Alert severity='error'>
        <AlertTitle title={error.message}>エラーが発生しました</AlertTitle>
        <h2>エラー解決のヒント</h2>
        <ol>
          <li>
            <h3>処理をリトライ</h3>
            <p>以下の「リトライ」ボタンをクリックして、処理を再実行してください。</p>
            <Button variant='contained' color='error' onClick={onRetry}>
              リトライ
            </Button>
          </li>
          {!!config.pluginReleasePageUrl && (
            <li>
              <h3>最新版のプラグインをインストール</h3>
              <p>
                プラグインの最新版をインストールすることで、問題が解決する可能性があります。
                <br />
                以下のリンクから最新版のプラグインをダウンロードし、再度インストールしてください。
              </p>
              <Button
                variant='contained'
                color='error'
                onClick={() => window.open(config.pluginReleasePageUrl, '_blank')}
              >
                最新版をダウンロード
              </Button>
            </li>
          )}
          <li>
            <h3>プラグイン設定を更新</h3>
            <p>
              保存されているプラグイン設定情報が古くなっている可能性があります。以下の手順でプラグイン設定を更新してください。
              <ul>
                <li>プラグイン設定画面を開く</li>
                <li>設定を変更せず、「保存」 ボタンをクリック</li>
                <li>アプリを更新</li>
                <li>動作が改善されているか確認</li>
                <li>-- 動作が改善されない場合は加えて以下の手順 --</li>
                <li>再度プラグイン設定画面を開き、設定画面右下のリセットボタンをクリック</li>
                <li>必要な設定を行い、「保存」 ボタンをクリック</li>
                <li>アプリを更新</li>
                <li>動作が改善されているか確認</li>
              </ul>
            </p>
          </li>
          <li>
            <h3>お問い合わせ</h3>
            <p>
              上記全てを試しても解決しない場合、下記のエラー内容を添えて開発者までお問い合わせください。
            </p>
            <pre>
              <code>
                {JSON.stringify(
                  {
                    プラグインID: config.id,
                    プラグイン名: config.manifest.base.name.ja,
                    バージョン: config.manifest.base.version,
                    エラーメッセージ: error?.message ?? '不明なエラー ',
                    エラースタック: error?.stack,
                    エラー詳細: error,
                  },
                  null,
                  2
                )}
              </code>
            </pre>
            <Button
              variant='contained'
              color='error'
              onClick={() => window.open(URL_INQUIRY, '_blank')}
            >
              お問い合わせ
            </Button>
          </li>
        </ol>
      </Alert>
    </div>
  );
}

const StyledErrorFallback = styled(ErrorFallbackComponent)`
  margin: 8px;

  h2 {
    font-size: 20px;
    margin-bottom: 8px;
    font-weight: bold;
  }
  h3 {
    font-size: 18px;
    margin: 0 0 6px;
    font-weight: bold;
  }
  p {
    margin: 0 0 8px;
  }

  ol {
    list-style: decimal;
    display: grid;
    gap: 32px;
    padding-inline-start: 16px;
  }

  ul {
    padding: 8px 0;
    list-style: disc;
    display: grid;
    gap: 8px;
    padding-inline-start: 16px;
  }

  pre {
    display: grid;
    background-color: rgb(31 41 55);
    color: rgb(243 244 246);
    padding: 16px;
    margin-bottom: 8px;
    max-width: 400px;
  }

  code {
    width: 100%;
    overflow-x: auto;
  }
`;

export function ErrorBoundary(props: PropsWithChildren<{ config: Plugin.Meta.Config }>) {
  const { children, config } = props;
  return (
    <PrimitiveErrorBoundary
      fallbackRender={(props) => <StyledErrorFallback {...props} config={config} />}
    >
      {children}
    </PrimitiveErrorBoundary>
  );
}

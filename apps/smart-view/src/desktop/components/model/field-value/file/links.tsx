import styled from '@emotion/styled';
import { downloadFile, kintoneAPI } from '@konomi-app/kintone-utilities';
import { useSnackbar } from 'notistack';

type Props = { files: kintoneAPI.field.File['value'] };
type LinkProps = { file: kintoneAPI.field.File['value'][number] };

function Link({ file }: LinkProps) {
  const { enqueueSnackbar } = useSnackbar();
  const onClick = async () => {
    const link = document.createElement('a');
    const blob = await downloadFile({ fileKey: file.fileKey });
    link.download = file.name;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    enqueueSnackbar('ファイルをダウンロードしました', { variant: 'success' });
  };

  return <a onClick={onClick}>{file.name}</a>;
}

function Container({ className, files }: Props & { className?: string }) {
  return (
    <div className={className}>
      {files.map((file, i) => (
        <Link key={i} file={file} />
      ))}
    </div>
  );
}

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
`;

export default StyledContainer;

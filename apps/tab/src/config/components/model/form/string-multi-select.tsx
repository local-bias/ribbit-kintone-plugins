import { Autocomplete, TextField } from '@mui/material';
import { type Atom, type PrimitiveAtom, useAtom, useAtomValue } from '@repo/jotai';

type Props = {
  /** 選択中の値を保持するatom */
  valuesAtom: PrimitiveAtom<string[]>;
  /** 選択肢を提供するatom */
  optionsAtom: Atom<Promise<string[]>>;
  label: string;
  placeholder: string;
  noOptionsText: string;
  /**
   * 選択肢に存在しない値の入力を許可するかどうか
   *
   * ラベルのようにキー情報を持たない対象では、アプリ側の変更によって
   * 選択肢から消えた値を保持できるよう`true`を指定します
   */
  freeSolo?: boolean;
};

/**
 * 文字列の一覧から複数の値を選択するオートコンプリートです
 *
 * グループフィールドのコード・スペースの要素ID・ラベルの文言など、
 * 文字列そのものが識別子となる設定で使用します
 */
export function StringMultiSelect(props: Props) {
  const { valuesAtom, optionsAtom, label, placeholder, noOptionsText, freeSolo = false } = props;
  const options = useAtomValue(optionsAtom);
  const [values, setValues] = useAtom(valuesAtom);

  return (
    <Autocomplete
      multiple
      freeSolo={freeSolo}
      value={values}
      options={options}
      noOptionsText={noOptionsText}
      onChange={(_, selected) => setValues([...selected])}
      sx={{ width: 480, maxWidth: '100%' }}
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} />}
    />
  );
}

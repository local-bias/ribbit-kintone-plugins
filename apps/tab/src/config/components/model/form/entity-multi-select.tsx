import { Autocomplete, TextField } from '@mui/material';
import { type Atom, type PrimitiveAtom, useAtom, useAtomValue } from '@repo/jotai';
import type { EntityOption } from '@/config/states/kintone';

type Props = {
  /** 選択中のコードを保持するatom */
  valuesAtom: PrimitiveAtom<string[]>;
  /** 選択肢を提供するatom */
  optionsAtom: Atom<Promise<EntityOption[]>>;
  label: string;
};

/**
 * ユーザー・グループ・組織のように、コードと表示名を持つ選択肢から複数選択します
 *
 * 選択肢に存在しないコード(削除されたユーザーなど)も、設定情報からは失われないよう保持します
 */
export function EntityMultiSelect({ valuesAtom, optionsAtom, label }: Props) {
  const options = useAtomValue(optionsAtom);
  const [values, setValues] = useAtom(valuesAtom);

  const selected = values.map(
    (code) => options.find((option) => option.code === code) ?? { code, name: code }
  );

  return (
    <Autocomplete
      multiple
      value={selected}
      options={options}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={(option) => option.name || option.code}
      onChange={(_, next) => setValues(next.map((option) => option.code))}
      sx={{ width: 480, maxWidth: '100%' }}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

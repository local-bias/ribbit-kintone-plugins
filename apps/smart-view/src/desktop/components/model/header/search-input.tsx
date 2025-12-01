import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { handleSearchInputChangeAtom, searchTextAtom } from '../../../states/search-text';

export default function SearchInput() {
  const searchText = useAtomValue(searchTextAtom);
  const onSearchTextChange = useSetAtom(handleSearchInputChangeAtom);

  return (
    <TextField
      variant='outlined'
      color='primary'
      label='フィールドを検索'
      value={searchText}
      onChange={onSearchTextChange}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

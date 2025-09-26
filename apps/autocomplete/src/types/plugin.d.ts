declare namespace Plugin {
  type AutocompleteOption = {
    label: string;
    value: string;
    quickSearch: string;
  };

  type CacheData = CacheDataV1;

  type CacheDataV1 = {
    version: 1;
  } & Record<string, string[]>;
}

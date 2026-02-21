import { listener } from '@/lib/listener';
import { restorePluginConfig } from '@/lib/plugin';
import { css } from '@emotion/css';
import { getMetaSubtable_UNSTABLE, kintoneAPI, sortField } from '@konomi-app/kintone-utilities';
import { getCurrentRecord, setCurrentRecord } from '@lb-ribbit/kintone-xapp';

const CLASSNAME_TH = 'ribbit-sort-subtable-th';

listener.add(['app.record.create.show', 'app.record.edit.show'], async (event) => {
  const config = restorePluginConfig();
  const ignoreFields = config?.ignoreFields ?? [];

  const metaSubtable = getMetaSubtable_UNSTABLE();

  if (!metaSubtable) {
    return event;
  }

  for (const subtable of metaSubtable) {
    if (!subtable) {
      console.warn('subtable is not found');
      continue;
    }
    const { var: fieldCode, fieldList } = subtable;
    if (ignoreFields.includes(fieldCode)) {
      continue;
    }

    Object.values(fieldList).forEach((field) => {
      if (!field) {
        console.warn('field is not found');
        return;
      }
      const { var: subtableFieldCode } = field;
      const element = document.querySelector<HTMLTableCellElement>(`.label-${field.id}`);
      if (!element) {
        return;
      }

      element.classList.add(css`
        position: relative;
        padding-right: 2rem;
        cursor: pointer;

        .${CLASSNAME_TH} {
          display: none;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translate(-50%, -50%);
          color: #fffc;
          font-weight: 600;
          transition: all 250ms ease;
          background-color: #fff0;
          border-radius: 9999px;
          width: 1.5rem;
          height: 1.5rem;
          place-items: center;
        }

        &:hover {
          .${CLASSNAME_TH} {
            display: grid;
            background-color: #fff3;
          }
        }

        &.asc {
          .${CLASSNAME_TH} {
            background-color: #fff3;
          }
        }

        &.desc {
          .${CLASSNAME_TH} {
            background-color: #fff3;
            transform: translate(-50%, -50%) rotate(180deg);
          }
        }
      `);
      const icon = document.createElement('div');
      icon.classList.add(CLASSNAME_TH);
      icon.innerHTML = getArrowUpSvg();
      element.append(icon);

      element.addEventListener('click', () => {
        const sort = element.dataset.sort === 'asc' ? 'desc' : 'asc';
        element.dataset.sort = sort;
        element.classList.remove('asc', 'desc');
        element.classList.add(sort);
        sortSubtable({ sort, fieldCode, subtableFieldCode });
      });
    });
  }

  return event;
});

const getArrowUpSvg =
  () => `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
<path stroke-linecap="round" stroke-linejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
</svg>
`;

const sortSubtable = (params: {
  sort: 'asc' | 'desc';
  fieldCode: string;
  subtableFieldCode: string;
}) => {
  const { record } = getCurrentRecord();

  const subtable = record[params.fieldCode] as kintoneAPI.field.Subtable;

  subtable.value = subtable.value.sort((a, b) => {
    const aField = a.value[params.subtableFieldCode];
    const bField = b.value[params.subtableFieldCode];
    console.log({ aField, bField });
    return params.sort === 'asc' ? sortField(aField, bField) : sortField(bField, aField);
  });

  subtable.value.forEach((row) => {
    Object.keys(row.value).forEach((fieldCode) => {
      //@ts-ignore
      row.value[fieldCode].lookup = true;
    });
  });

  setCurrentRecord({ record });
};

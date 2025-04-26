import { controlField, getChangeEvents } from '@/common/kintone';
import { restoreStorage } from '@/common/plugin';
import { manager } from '@/lib/event-manager';
import { PLUGIN_ID } from '@/lib/global';
import { kintoneAPI } from '@konomi-app/kintone-utilities';

class C {
  private readonly _fieldCode: string;
  private readonly _editable: boolean;

  public constructor(fieldCode: string, editable: boolean) {
    this._fieldCode = fieldCode;
    this._editable = editable;
  }

  public control(
    e: kintoneAPI.js.Event,
    rule: (e: kintoneAPI.js.Event) => boolean
  ): kintoneAPI.js.Event {
    const record = e.record as kintoneAPI.RecordData;
    controlField(record, this._fieldCode, (field) => {
      if (rule(e)) {
        //@ts-ignore
        field.disabled = !this._editable;
      } else {
        //@ts-ignore
        field.disabled = this._editable;
      }
    });
    return e;
  }
}

const pluginConfig = restoreStorage(PLUGIN_ID);

for (const { targetField, rules } of pluginConfig.conditions) {
  for (const rule of rules) {
    const events: kintoneAPI.js.EventType[] = [
      'app.record.create.show',
      'app.record.edit.show',
      'app.record.index.edit.show',
    ];

    if (rule.type !== 'always') {
      events.push(...getChangeEvents([rule.field], ['create', 'edit', 'index.edit']));
    }

    const c = new C(targetField, rule.editable);

    let action: (event: kintoneAPI.js.Event) => kintoneAPI.js.Event = (e) => {
      console.log('アクションが未登録です');
      return e;
    };

    switch (rule.type) {
      case 'always':
        action = (e) => c.control(e, () => true);
        break;
      case 'empty':
        action = (e) => c.control(e, (e) => !e.record[rule.field]?.value);
        break;
      case 'equal':
        action = (e) => c.control(e, (e) => e.record[rule.field]?.value === rule.value);
        break;
      case 'full':
        action = (e) => c.control(e, (e) => !!e.record[rule.field]?.value);
        break;
      case 'greater':
        action = (e) =>
          c.control(e, (e) => {
            const value = e.record[rule.field]?.value;
            if (typeof value !== 'number') {
              return false;
            }
            return Number(value) >= Number(rule.value);
          });
        break;
      case 'includes':
        action = (e) =>
          c.control(e, (e) => {
            const value = e.record[rule.field]?.value;
            if (typeof value !== 'string') {
              return false;
            }
            return value.includes(rule.value);
          });
        break;
      case 'less':
        action = (e) =>
          c.control(e, (e) => {
            const value = e.record[rule.field]?.value;
            if (typeof value !== 'number') {
              return false;
            }
            return Number(value) <= Number(rule.value);
          });
        break;
      case 'notEqual':
        action = (e) => c.control(e, (e) => e.record[rule.field]?.value !== rule.value);
        break;
      case 'notIncludes':
        action = (e) =>
          c.control(e, (e) => {
            const value = e.record[rule.field]?.value;
            if (typeof value !== 'string') {
              return false;
            }
            return !value.includes(rule.value);
          });
        break;
    }
    manager.addChangeEvents(events, action);
  }
}

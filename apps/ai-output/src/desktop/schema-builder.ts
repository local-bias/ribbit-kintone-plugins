import type { ResolvedOutputFieldDef } from '@/schema/plugin-config';

interface JSONSchemaProperty {
  type: string;
  description: string;
  items?: { type: string };
}

interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
  additionalProperties: false;
}

export function buildResponseSchema(outputFields: ResolvedOutputFieldDef[]): JSONSchema {
  const properties: Record<string, JSONSchemaProperty> = {};
  const required: string[] = [];

  for (const field of outputFields) {
    if (!field.fieldCode) {
      continue;
    }

    required.push(field.fieldCode);

    switch (field.type) {
      case 'string':
        properties[field.fieldCode] = {
          type: 'string',
          description: field.description || field.label || field.fieldCode,
        };
        break;
      case 'number':
        properties[field.fieldCode] = {
          type: 'number',
          description: field.description || field.label || field.fieldCode,
        };
        break;
      case 'boolean':
        properties[field.fieldCode] = {
          type: 'boolean',
          description: field.description || field.label || field.fieldCode,
        };
        break;
      case 'array_string':
        properties[field.fieldCode] = {
          type: 'array',
          description: field.description || field.label || field.fieldCode,
          items: { type: 'string' },
        };
        break;
    }
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

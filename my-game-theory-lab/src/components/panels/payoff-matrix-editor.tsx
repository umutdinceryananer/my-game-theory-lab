import * as React from 'react';

import { Input } from '@/components/ui/input';
import type { PayoffMatrix } from '@/core/types';

export type PayoffMatrixEditorProps = {
  value: PayoffMatrix;
  onChange: (next: PayoffMatrix) => void;
};

const fields: Array<{
  key: keyof PayoffMatrix;
  label: string;
  description: string;
}> = [
  {
    key: 'temptation',
    label: 'Temptation (T)',
    description: 'Defecting while the opponent cooperates.',
  },
  {
    key: 'reward',
    label: 'Reward (R)',
    description: 'Both players cooperate.',
  },
  {
    key: 'punishment',
    label: 'Punishment (P)',
    description: 'Both players defect.',
  },
  {
    key: 'sucker',
    label: 'Sucker (S)',
    description: 'Cooperating while the opponent defects.',
  },
];

export function PayoffMatrixEditor({ value, onChange }: PayoffMatrixEditorProps) {
  const handleChange = (key: keyof PayoffMatrix) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (Number.isNaN(next) || !Number.isFinite(next)) {
      return;
    }

    onChange({
      ...value,
      [key]: next,
    });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key} className="space-y-2 rounded-md border border-dashed border-muted p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
            <p className="text-xs text-muted-foreground">{field.description}</p>
          </div>
          <Input
            type="number"
            step={0.1}
            value={value[field.key]}
            onChange={handleChange(field.key)}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}
'use client';

import * as React from 'react';
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface MultiSelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleToggleOption = (optionValue: string) => {
    if (selected.includes(optionValue)) {
      onChange(selected.filter((item) => item !== optionValue));
    } else {
      onChange([...selected, optionValue]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('justify-between min-h-10 h-auto', className)}
          disabled={disabled}
        >
          <div className='flex gap-1 flex-wrap'>
            {selected.length === 0 ? (
              <span className='text-muted-foreground'>{placeholder}</span>
            ) : (
              <>
                {selected.map((item) => {
                  const option = options.find((opt) => opt.value === item);
                  if (!option) return null;
                  return (
                    <div
                      key={item}
                      className='inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-sm text-sm'
                    >
                      {option.icon}
                      {option.label}
                      <span
                        className='ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer'
                        role='button'
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleUnselect(item);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnselect(item);
                        }}
                      >
                        <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
          <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <div className='max-h-60 overflow-auto p-1'>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <div
                key={option.value}
                className='relative flex cursor-pointer select-none items-center space-x-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground'
                onClick={() => handleToggleOption(option.value)}
              >
                <Checkbox checked={isSelected} />
                {option.icon}
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

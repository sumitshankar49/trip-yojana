"use client";

import type {
  ChangeEventHandler,
  HTMLAttributes,
  HTMLInputTypeAttribute,
  JSX,
  ReactNode,
} from "react";
import type {
  FieldPath,
  FieldValues,
  UseControllerProps,
} from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/packages/components/ui/form";
import { Input } from "@/packages/components/ui/input";

interface InputFieldControlledProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string;
  placeholder: string;
  description?: string;
  disabled?: boolean;
  type?: HTMLInputTypeAttribute;
  required?: boolean;
  onBlur?: () => void;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  icon?: React.ReactNode;
  endAdornment?: ReactNode;
  step?: string | number;
  min?: string | number;
  max?: string | number;
  maxLength?: number;
  className?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}

export const InputFieldControlled = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled = false,
  type = "text",
  required = false,
  onBlur,
  onChange,
  icon,
  endAdornment,
  step,
  min,
  max,
  maxLength,
  className,
  inputMode,
}: InputFieldControlledProps<TFieldValues, TName>): JSX.Element => (
  <>
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="mx-1">
          {label ? (
            <FormLabel>
              {icon && <span className="mr-1">{icon}</span>}
              {label} {required ? <span className="text-destructive"> * </span> : ""}
            </FormLabel>
          ) : (
            ""
          )}
          <FormControl>
            <div className={endAdornment ? "relative" : undefined}>
              <Input
                type={type}
                disabled={disabled}
                placeholder={placeholder}
                step={step}
                min={min}
                max={max}
                maxLength={maxLength}
                inputMode={inputMode}
                className={endAdornment ? `${className ?? ""} pr-10`.trim() : className}
                {...field}
                onChange={(event) => {
                  field.onChange(event);
                  onChange?.(event);
                }}
                onBlur={onBlur ? onBlur : field.onBlur}
              />
              {endAdornment ? (
                <div className="absolute inset-y-0 right-3 flex items-center">{endAdornment}</div>
              ) : null}
            </div>
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : ""}
          <FormMessage />
        </FormItem>
      )}
    />
  </>
);
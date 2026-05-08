"use client";

import type { HTMLInputTypeAttribute, JSX } from "react";
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
  icon?: React.ReactNode;
  step?: string | number;
  min?: string | number;
  max?: string | number;
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
  icon,
  step,
  min,
  max,
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
              {label}{" "}
              {required ? <span className="text-destructive"> * </span> : ""}
            </FormLabel>
          ) : (
            ""
          )}
          <FormControl>
            <Input
              type={type}
              disabled={disabled}
              placeholder={placeholder}
              step={step}
              min={min}
              max={max}
              {...field}
              onBlur={onBlur ? onBlur : field.onBlur}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : ""}
          <FormMessage />
        </FormItem>
      )}
    />
  </>
);

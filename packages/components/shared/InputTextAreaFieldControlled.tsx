"use client";

import type { JSX } from "react";
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
import { Textarea } from "@/packages/components/ui/textarea";

interface InputTextAreaFieldControlledProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string;
  placeholder: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  onBlur?: () => void;
  icon?: React.ReactNode;
}

export const InputTextAreaFieldControlled = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled = false,
  required = false,
  rows = 3,
  onBlur,
  icon,
}: InputTextAreaFieldControlledProps<TFieldValues, TName>): JSX.Element => (
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
            <Textarea
              className="resize-none"
              disabled={disabled}
              placeholder={placeholder}
              rows={rows}
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

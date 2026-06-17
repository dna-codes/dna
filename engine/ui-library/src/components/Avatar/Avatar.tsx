import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { Avatar as RadixAvatar } from "radix-ui";

export type AvatarProps = ComponentPropsWithoutRef<typeof RadixAvatar.Root>;
export type AvatarImageProps = ComponentPropsWithoutRef<
  typeof RadixAvatar.Image
>;
export type AvatarFallbackProps = ComponentPropsWithoutRef<
  typeof RadixAvatar.Fallback
>;

/**
 * Root of a headless avatar built on Radix `Avatar`. Renders `Fallback` only
 * once the `Image` fails (or while it loads, after an optional `delayMs`), so
 * initials never flash over a working photo. Compose with the attached `Image`
 * and `Fallback` parts; each ships a `data-ui-avatar-*` hook plus forwarded
 * `className`/`style`.
 */
const Root = forwardRef<ElementRef<typeof RadixAvatar.Root>, AvatarProps>(
  function Avatar({ className, ...rest }, ref) {
    return (
      <RadixAvatar.Root
        ref={ref}
        className={className}
        data-ui-avatar=""
        {...rest}
      />
    );
  },
);

const Image = forwardRef<
  ElementRef<typeof RadixAvatar.Image>,
  AvatarImageProps
>(function AvatarImage({ className, ...rest }, ref) {
  return (
    <RadixAvatar.Image
      ref={ref}
      className={className}
      data-ui-avatar-image=""
      {...rest}
    />
  );
});

const Fallback = forwardRef<
  ElementRef<typeof RadixAvatar.Fallback>,
  AvatarFallbackProps
>(function AvatarFallback({ className, ...rest }, ref) {
  return (
    <RadixAvatar.Fallback
      ref={ref}
      className={className}
      data-ui-avatar-fallback=""
      {...rest}
    />
  );
});

export const Avatar = Object.assign(Root, { Image, Fallback });

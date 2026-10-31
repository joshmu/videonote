/**
 * @path /src/components/shared/Select/Select.tsx
 *
 * @project videonote
 * @file Select.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 27th September 2020
 * @modified Sunday, 22nd November 2020 4:26:43 pm
 * @copyright © 2020 - 2020 MU
 */

import React, { KeyboardEvent, ReactNode } from "react";

interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  modalId?: string;
  padding?: string;
  animate?: string;
  text?: string;
  cursor?: string;
  props?: { [key: string]: any };
}

export const Select = ({
  children,
  modalId = null,
  padding = "px-4 py-2",
  animate = "",
  text = "text-themeText",
  cursor = "cursor-pointer",
  ...props
}: SelectProps) => {
  const isAction = !!modalId || "onClick" in props;

  return (
    <div
      data-modal={modalId}
      {...(isAction && {
        role: "button",
        tabIndex: 0,
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.currentTarget.click();
        },
      })}
      className={`${padding} ${animate} flex items-center ${cursor} ${text} hover:bg-themeSelect hover:text-white`}
      {...props}
    >
      {children}
    </div>
  );
};

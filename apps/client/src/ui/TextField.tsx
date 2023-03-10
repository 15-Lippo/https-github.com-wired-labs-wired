import { RefObject, useId } from "react";
import { MdOutlineHelpOutline } from "react-icons/md";

import Tooltip from "./Tooltip";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  name?: string;
  help?: string;
  outline?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
}

export default function TextField({ name, help, inputRef, outline = false, ...rest }: Props) {
  const id = useId();

  const outlineClass = outline ? "border border-neutral-200" : "";

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-1">
        <label htmlFor={id} className="pointer-events-none block text-lg font-bold">
          {name}
        </label>

        {help && (
          <div>
            <Tooltip text={help} placement="right">
              <MdOutlineHelpOutline />
            </Tooltip>
          </div>
        )}
      </div>

      <div className={`flex items-center rounded-md bg-white ${outlineClass}`}>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          className="h-full w-full rounded-md px-3 py-2"
          {...rest}
        />
      </div>
    </div>
  );
}

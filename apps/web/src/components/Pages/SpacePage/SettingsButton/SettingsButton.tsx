import { useState } from "react";
import { BsFillGearFill } from "react-icons/bs";

import IconButton from "../../../base/IconButton";
import EditSpaceDialog from "./EditSpaceDialog";

interface Props {
  spaceId: string;
}

export default function SettingsButton({ spaceId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <EditSpaceDialog spaceId={spaceId} open={open} setOpen={setOpen} />

      <IconButton onClick={() => setOpen(true)}>
        <BsFillGearFill />
      </IconButton>
    </div>
  );
}

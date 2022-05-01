import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import { useStudioStore } from "../src/helpers/studio/store";
import { useAutosave } from "../src/helpers/studio/hooks/useAutosave";

import StudioNavbar from "../src/components/studio/StudioNavbar/StudioNavbar";
import StudioCanvas from "../src/components/studio/StudioCanvas/StudioCanvas";
import InspectMenu from "../src/components/studio/InspectMenu";
import TreeMenu from "../src/components/studio/TreeMenu/TreeMenu";

export default function Studio() {
  const router = useRouter();
  const id = router.query.id as string;

  useAutosave();

  useEffect(() => {
    useStudioStore.setState({ id });
  }, [id]);

  return (
    <div className="h-full overflow-hidden">
      <Head>
        <title>Studio · The Wired</title>
      </Head>

      <div className="bg-white border-b w-full h-14">
        <StudioNavbar />
      </div>

      <div className="flex h-full">
        <div className="fixed left-0 bg-white border-r h-full w-[300px]">
          <TreeMenu />
        </div>

        <div className="bg-neutral-100 w-full pl-[300px] pr-[400px]">
          <StudioCanvas />
        </div>

        <div className="fixed right-0 bg-white border-l h-full w-[400px]">
          <InspectMenu />
        </div>
      </div>
    </div>
  );
}

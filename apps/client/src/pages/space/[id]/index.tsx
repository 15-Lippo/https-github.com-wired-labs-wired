import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";

import { trpc } from "../../../client/trpc";
import { getNavbarLayout } from "../../../home/layouts/NavbarLayout/NavbarLayout";
import SpaceLayout from "../../../home/layouts/SpaceLayout/SpaceLayout";
import { prisma } from "../../../server/prisma";
import { appRouter } from "../../../server/router/_app";
import { hexDisplayToNumber } from "../../../utils/numberToHexDisplay";

export const getServerSideProps = async ({ res, query }: GetServerSidePropsContext) => {
  const ONE_MINUTE_IN_SECONDS = 60;
  const ONE_MONTH_IN_SECONDS = 60 * 60 * 24 * 30;

  res.setHeader(
    "Cache-Control",
    `public, max-age=0, s-maxage=${ONE_MINUTE_IN_SECONDS}, stale-while-revalidate=${ONE_MONTH_IN_SECONDS}`
  );

  const hexId = query.id as string;
  const id = hexDisplayToNumber(hexId);

  const ssg = await createProxySSGHelpers({
    router: appRouter,
    ctx: {
      prisma,
      res,
      session: null,
    },
  });

  await ssg.space.byId.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export default function Space({ id }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: space } = trpc.space.byId.useQuery({ id });

  // const { data: stats } = trpc.public.modelStats.useQuery(
  //   { publicationId: id },
  //   {
  //     refetchOnWindowFocus: false,
  //     refetchOnMount: false,
  //     refetchOnReconnect: false,
  //     trpc: {
  //       context: {
  //         skipBatch: true,
  //       },
  //     },
  //   }
  // );

  return (
    <SpaceLayout id={id} author={space?.author ?? null} metadata={space?.metadata ?? null}>
      <div className="space-y-4 text-lg">
        {space?.metadata?.description && (
          <div className="whitespace-pre-line">{space?.metadata.description}</div>
        )}

        {/* {stats && (
          <div className="flex text-neutral-500">
            <div>
              {["File Size", "Polygons", "Materials", "Meshes", "Skins", "Bones"].map((title) => (
                <div key={title}>{title}</div>
              ))}
            </div>

            <div className="pl-4">
              {[
                bytesToDisplay(stats.fileSize),
                numberToCommas(stats.triangleCount),
                numberToCommas(stats.materialCount),
                numberToCommas(stats.meshCount),
                numberToCommas(stats.skinCount),
                numberToCommas(stats.boneCount),
              ].map((stat, i) => (
                <div key={i}>{stat}</div>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </SpaceLayout>
  );
}

Space.getLayout = getNavbarLayout;

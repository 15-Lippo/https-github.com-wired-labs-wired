import {
  GetProfileByHandleDocument,
  GetProfileByHandleQuery,
  GetProfileByHandleQueryVariables,
} from "../../../generated/graphql";
import { lensClient } from "../../../helpers/lens/client";
import { HANDLE_ENDING } from "../../../helpers/lens/constants";
import { getMediaImageSSR } from "../../../helpers/lens/hooks/useMediaImage";
import { PageMetadata } from "../../../helpers/types";

export interface ProfileLayoutProps {
  handle: string;
  metadata: PageMetadata;
  profile: GetProfileByHandleQuery["profiles"]["items"][0] | undefined;
}

export async function getProfileLayoutProps(handle: string) {
  const profileQuery = await lensClient
    .query<GetProfileByHandleQuery, GetProfileByHandleQueryVariables>(
      GetProfileByHandleDocument,
      { handle: handle.concat(HANDLE_ENDING) }
    )
    .toPromise();

  const profile = profileQuery.data?.profiles.items[0];
  const title = profile?.name ? `${profile?.name} (@${handle})` : `@${handle}`;
  const metadata: PageMetadata = {
    title,
    description: profile?.bio ?? "",
    image: getMediaImageSSR(profile?.picture) ?? "",
  };

  return { handle, metadata, profile };
}
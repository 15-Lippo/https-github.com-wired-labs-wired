import { FaHashtag, FaTwitter } from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";

import { useLensStore } from "../../src/helpers/lens/store";
import { useProfileByHandle } from "../../src/helpers/lens/hooks/useProfileByHandle";
import { useMediaImage } from "../../src/helpers/lens/hooks/useMediaImage";
import { useProfileSpaces } from "../../src/helpers/lens/hooks/useProfileSpaces";

import NavbarLayout from "../../src/components/layouts/NavbarLayout/NavbarLayout";
import ProfilePicture from "../../src/components/lens/ProfilePicture";
import Button from "../../src/components/base/Button";
import SpaceCard from "../../src/components/ui/SpaceCard";

export default function User() {
  const router = useRouter();
  const handle = router.query.handle as string;

  const viewerHandle = useLensStore((state) => state.handle);
  const profile = useProfileByHandle(handle);
  const { url: coverUrl } = useMediaImage(profile?.coverPicture);

  const spaces = useProfileSpaces(profile?.id);

  if (!profile) return null;

  return (
    <div>
      <Head>
        {profile?.name ? (
          <title>
            {profile.name} (@{profile.handle}) · The Wired
          </title>
        ) : (
          <title>@{profile.handle} · The Wired</title>
        )}
      </Head>

      <div
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
        }}
        className="w-full h-80 bg-cover bg-center bg-secondary"
      />

      <div className="flex justify-center">
        <div className="max-w mx-8 flex space-x-12">
          <div className="w-64 flex-shrink-0 space-y-6">
            <div className="h-32">
              <div className="relative w-full">
                <div
                  className="absolute -bottom-32 transform
                             rounded-xl ring-8 ring-background"
                >
                  <ProfilePicture profile={profile} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-black break-all">
                {profile?.name ?? handle}
              </div>
              <div className="gradient-text text-lg break-all font-bold w-fit">
                @{handle}
              </div>
            </div>

            <div>
              {handle === viewerHandle && (
                <Link href="/settings" passHref>
                  <div>
                    <Button variant="outlined" fullWidth>
                      Edit Profile
                    </Button>
                  </div>
                </Link>
              )}
            </div>

            <div className="font-bold">{profile?.bio}</div>

            <div className="space-y-4">
              <ProfileRow icon={<FaHashtag className="text-lg" />}>
                {profile.id}
              </ProfileRow>

              {profile?.location && (
                <ProfileRow icon={<MdOutlineLocationOn />}>
                  {profile?.location}
                </ProfileRow>
              )}

              {profile?.twitter && (
                <ProfileRow icon={<FaTwitter className="text-sky-500" />}>
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {profile.twitter}
                  </a>
                </ProfileRow>
              )}

              {profile?.website && (
                <ProfileRow
                  icon={
                    <img
                      src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${profile.website}`}
                      alt="website favicon"
                    />
                  }
                >
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {profile.website}
                  </a>
                </ProfileRow>
              )}
            </div>
          </div>

          <div className="w-full p-4 space-y-4">
            <div className="flex items-center justify-center w-full space-x-4">
              <div className="font-bold rounded-lg px-3 py-1 text-lg">
                Spaces
              </div>
            </div>

            <div className="space-y-2">
              {spaces?.map((space) => (
                <div key={space.id}>
                  <Link href={`/space/${space.id}`} passHref>
                    <div>
                      <SpaceCard space={space} />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

User.Layout = NavbarLayout;

function ProfileRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center space-x-6">
      <div className="text-xl w-6">{icon}</div>
      <div className="font-bold">{children}</div>
    </div>
  );
}

import { useContext, useState } from "react";
import {
  Avatar,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Link from "next/link";
import {
  ceramic,
  CeramicContext,
  removeFeedItem,
  unpin,
  useProfile,
  usePost,
} from "ceramic";
import { TrendingUpRounded } from "@mui/icons-material";

function formatTime(time: number) {
  const now = Date.now();
  const diff = now - time;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 31) return `${days}d`;

  return new Date(time).toLocaleString();
}

interface Props {
  streamId: string;
}

export default function FeedItem({ streamId }: Props) {
  const { authenticated, userId } = useContext(CeramicContext);

  const { post, controller } = usePost(streamId);
  const { profile, imageUrl } = useProfile(controller);

  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  async function handleDelete() {
    setLoading(true);
    setAnchorEl(null);
    await unpin(streamId);
    await removeFeedItem(streamId, userId, ceramic);
    setDeleted(true);
    setLoading(false);
  }

  if (deleted) return null;

  return (
    <div>
      <Stack direction="row" spacing={2} sx={{ padding: 2 }}>
        <Link href={`/home/user/${controller}`} passHref>
          <Avatar
            className="clickable"
            variant="rounded"
            src={imageUrl}
            sx={{ width: "3rem", height: "3rem" }}
          />
        </Link>

        <Stack sx={{ width: "100%" }}>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            {profile ? (
              <Link href={`/home/user/${controller}`} passHref>
                <Typography className="link">{profile?.name}</Typography>
              </Link>
            ) : (
              <Skeleton width="100px" />
            )}

            {post && profile && (
              <Typography variant="caption" sx={{ color: "GrayText" }}>
                •
              </Typography>
            )}

            {post && (
              <Typography variant="caption" sx={{ color: "GrayText" }}>
                {formatTime(post.timestamp)}
              </Typography>
            )}
          </Stack>

          {post ? <Typography>{post.text}</Typography> : <Skeleton />}
        </Stack>

        {authenticated && userId === controller && (
          <div>
            <IconButton
              size="small"
              disabled={loading}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              {loading ? (
                <CircularProgress size="20px" color="info" />
              ) : (
                <MoreHorizIcon />
              )}
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={handleDelete}>Delete</MenuItem>
            </Menu>
          </div>
        )}
      </Stack>

      <Divider />
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { useRouter } from "next/router";
import { customAlphabet } from "nanoid";

import HomeLayout from "../../src/layouts/HomeLayout";
import SceneCard from "../../src/components/cards/SceneCard";
import HomeNavbar from "../../src/components/HomeNavbar";

const nanoid = customAlphabet("1234567890", 16);

export default function Scenes() {
  const router = useRouter();

  const [scenes, setScenes] = useState([]);
  const [uploaded, setUploaded] = useState<File>();

  useEffect(() => {
    const str = localStorage.getItem("scenes") ?? "[]";
    const list = JSON.parse(str);
    setScenes(list);
  }, []);

  useEffect(() => {
    if (!uploaded) return;

    const name = uploaded.name.slice(0, -5);

    const reader = new FileReader();
    reader.onload = (e) => handleNewScene(e.target.result as string, name);
    reader.readAsText(uploaded);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploaded]);

  async function handleNewScene(
    startingScene = "[]",
    startingName = "New Scene"
  ) {
    const id = nanoid();

    const str = localStorage.getItem("scenes");
    const list = JSON.parse(str) ?? [];

    list.push(id);

    localStorage.setItem("scenes", JSON.stringify(list));
    localStorage.setItem(`${id}-name`, startingName);
    localStorage.setItem(`${id}-scene`, startingScene);

    router.push(`/home/scene/${id}`);
  }

  return (
    <Grid container direction="column">
      <Grid item>
        <HomeNavbar text="Editor" />
      </Grid>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ padding: 4, paddingBottom: 0 }}
      >
        <Typography variant="h4">Scenes</Typography>

        <Stack direction="row" spacing={1}>
          <div>
            <input
              accept="application/json"
              style={{ display: "none" }}
              id="scene-import-input"
              multiple
              type="file"
              onChange={(e) => setUploaded(e.target.files[0])}
            />

            <label htmlFor="scene-import-input">
              <Tooltip title="Import Scene">
                <IconButton component="span">
                  <FileUploadIcon />
                </IconButton>
              </Tooltip>
            </label>
          </div>

          <span>
            <Tooltip title="New Scene">
              <IconButton onClick={() => handleNewScene()}>
                <AddBoxOutlinedIcon />
              </IconButton>
            </Tooltip>
          </span>
        </Stack>
      </Stack>

      <Box sx={{ padding: 4 }}>
        {!scenes || scenes.length === 0 ? (
          <div>
            <Typography>
              It looks like you don{"'"}t have any scenes.
            </Typography>
            <Typography>
              <Typography
                className="link"
                color="secondary"
                component="span"
                onClick={() => handleNewScene()}
              >
                Click Here
              </Typography>{" "}
              to get started.
            </Typography>
          </div>
        ) : (
          <Grid container spacing={3}>
            {scenes.map((id) => {
              return <SceneCard key={id} id={id} />;
            })}
          </Grid>
        )}
      </Box>
    </Grid>
  );
}

Scenes.Layout = HomeLayout;
import { Grid } from "@mui/material";

import HomeNavbar from "../../src/components/HomeNavbar";
import HomeLayout from "../../src/layouts/HomeLayout";

export default function Rooms() {
  return (
    <Grid container direction="column">
      <Grid item>
        <HomeNavbar text="Rooms" />
      </Grid>
    </Grid>
  );
}

Rooms.Layout = HomeLayout;
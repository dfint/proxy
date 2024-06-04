import { Handler, HttpError, nhttp } from "@nhttp/nhttp";
import { Database } from "./db.ts";

const app = nhttp({
  bodyParser: false,
});

const counter: Handler[] = [
  async (rev, next) => {
    const resourse = rev.url.split("/")[2];
    if (resourse) {
      const [key, value] = Object.entries(rev.params)[0];
      if (key && value) {
        const result = await (await Database.getInstance()).increment(resourse, key, value);
        console.log("analytics", resourse, key, value, result);
      }
    }
    return next();
  },
];

app.get("/statistics/:key?", async (rev) => {
  console.log(rev.params.key);
  const res = await (await Database.getInstance()).getResourse(rev.params.key);
  return res;
});

app.get("/download/dictionary/:language/", counter, async (rev) => {
  const res = await fetch(
    `https://raw.githubusercontent.com/dfint/autobuild/main/translation_build/csv_with_objects/${rev.params.language}/dfint_dictionary.csv`,
  );
  if (!res.ok) {
    throw new HttpError(404);
  }
  return res.body;
});

app.get("/download/font/:encoding/", counter, async (rev) => {
  const res = await fetch(
    `https://raw.githubusercontent.com/dfint/update-data/main/store/fonts/${rev.params.encoding}.png`,
  );
  if (!res.ok) {
    throw new HttpError(404);
  }
  return res.body;
});

app.get("/download/encoding/:encoding/", counter, async (rev) => {
  const res = await fetch(
    `https://raw.githubusercontent.com/dfint/update-data/main/store/encodings/${rev.params.encoding}.png`,
  );
  if (!res.ok) {
    throw new HttpError(404);
  }
  return res.body;
});

app.get("/download/offset/:version", counter, async (rev) => {
  const res = await fetch(
    `https://raw.githubusercontent.com/dfint/update-data/main/store/offsets/${rev.params.version}.toml`,
  );
  if (!res.ok) {
    throw new HttpError(404);
  }
  return res.body;
});

app.get("/download/metadata/:manifest", counter, async (rev) => {
  const res = await fetch(
    `https://raw.githubusercontent.com/dfint/update-data/main/metadata/${rev.params.manifest}.json`,
  );
  if (!res.ok) {
    throw new HttpError(404);
  }
  return res.body;
});

app.get("/download/installer/:os", counter, async (rev) => {
  if (rev.params.os !== "win" && rev.params.os !== "lin") {
    throw new HttpError(404);
  }

  const res = await fetch("https://api.github.com/repos/dfint/installer/releases/latest");
  if (!res.ok) {
    throw new HttpError(404);
  }
  const data = await res.json();

  const asset = data.assets.find((item: { name: string; browser_download_url: string }) =>
    rev.params.os === "win" ? item.name.endsWith(".zip") : item.name.endsWith("tar.gz"),
  );
  if (!asset) {
    throw new HttpError(404);
  }

  return rev.respondWith(Response.redirect(asset.browser_download_url));
});

app.listen(6969, () => {
  console.log("> Running on port 6969");
});

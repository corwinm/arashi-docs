import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://arashi.haphazard.dev",
  integrations: [
    starlight({
      title: "Arashi",
      description:
        "User and maintainer documentation for Arashi, the Git worktree manager for meta-repositories.",
      social: {
        github: "https://github.com/corwinm/arashi"
      },
      customCss: ["/src/styles/theme.css"],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" }
        },
        {
          label: "Commands",
          autogenerate: { directory: "commands" }
        },
        {
          label: "Contributing",
          autogenerate: { directory: "contributing" }
        }
      ]
    })
  ]
});

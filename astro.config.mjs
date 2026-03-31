import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://arashi.haphazard.dev",
  integrations: [
    starlight({
      title: "Arashi",
      description:
        "Git worktree manager for meta-repositories. Keep related repositories aligned while you work on a feature branch across a shared workspace.",
      logo: {
        src: "./src/assets/arashi-logo.svg",
        alt: "Arashi logo"
      },
      social: {
        github: "https://github.com/corwinm/arashi"
      },
      head: [
        {
          tag: "link",
          attrs: {
            rel: "icon",
            type: "image/svg+xml",
            href: "/favicon.svg"
          }
        }
      ],
      customCss: ["/src/styles/theme.css"],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" }
        },
        {
          label: "Workflows",
          autogenerate: { directory: "workflows" }
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

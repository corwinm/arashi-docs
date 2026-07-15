import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://arashi.haphazard.dev",
  integrations: [
    starlight({
      title: "Arashi",
      description:
        "Git worktree manager for standalone repositories and configured meta-repositories.",
      logo: {
        src: "./src/assets/arashi-logo.svg",
        alt: "Arashi logo"
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/corwinm/arashi"
        }
      ],
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
          items: [{ autogenerate: { directory: "getting-started" } }]
        },
        {
          label: "Workflows",
          items: [{ autogenerate: { directory: "workflows" } }]
        },
        {
          label: "Commands",
          items: [{ autogenerate: { directory: "commands" } }]
        },
        {
          label: "Contributing",
          items: [{ autogenerate: { directory: "contributing" } }]
        }
      ]
    })
  ]
});

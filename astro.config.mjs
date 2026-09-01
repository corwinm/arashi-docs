import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://arashi.haphazard.dev",
  integrations: [
    starlight({
      title: "Arashi",
      description:
        "Git worktree coordination for configured meta-repositories, with ad hoc support for unconfigured projects.",
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
          items: [
            { label: "Overview", link: "/workflows/" },
            { label: "Work on a Change", link: "/workflows/change-lifecycle/" },
            { label: "Coordinate Repositories", link: "/workflows/coordinate-repositories/" },
            { label: "Setup and Cleanup", link: "/workflows/setup-and-cleanup/" },
            { label: "Coding Agents", link: "/workflows/agents-and-specs/" },
            { label: "Scripts and CI", link: "/workflows/automation/" },
            {
              label: "Integrations",
              items: [
                { label: "Overview", link: "/workflows/environment-integrations/" },
                { label: "VS Code", link: "/workflows/vscode/" },
                { label: "tmux and sesh", link: "/workflows/tmux-and-sesh/" },
                { label: "Herdr", link: "/workflows/herdr/" },
                { label: "cmux", link: "/workflows/cmux/" },
                { label: "Kitty", link: "/workflows/kitty/" }
              ]
            }
          ]
        },
        {
          label: "Reference",
          items: [{ autogenerate: { directory: "reference" } }]
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

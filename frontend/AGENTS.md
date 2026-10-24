<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- The site view is a hand-rolled SVG isometric renderer (src/components/iso-scene.tsx); projection math and grid constants live in src/lib/iso.ts, hall data/creation in src/lib/halls.ts. Why: crisp clickable halls, no 3D dependency, SSR-safe.

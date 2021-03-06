# Tradit-TPL

*Use an HFS 2 'template' in HFS 3* - PRE-ALPHA stage

Note: big changes expected, see issue #4

## Features

- Speed! Always response within 10ms then stream the page  
  (without file sorting, though not implemented yet)
- Different "macro" concept, not interpreted but executed  
  (code describes best; or just feel it)

## Try it out

For it's way too early, not put to HFS "search online" list yet.

0. Get [HFS](https://github.com/rejetto/hfs) 0.23.0 or later, set it up.
1. Clone (or download archive of) this repository
2. Copy the `dist` folder to HFS plugin folder, rename as `Tradit-TPL`
3. Launch HFS, go to admin UI, Plugin panel, enable this plugin  
  First start will auto search & use the present `bare.tpl` for demo purpose
4. Go to "Shared Files" panel, put some files/folders
5. Browse files. See if it works
6. prepare & go to a folder with music files, and enjoy the music player (will appear at left-bottom corner)

To change template, in Plugin panel, configure this plugin and pick other desired template file.

But currently *none* of existing templates will work perfectly.

## Q&A

<details>

<summary>Expand Q&A</summary>

<br />

**Why "Tradit-TPL"?**  
I casually took it from word "traditional". But that word is not the case -- we have new way.  
And pronounce that "tra" as in "trap".

**How to use `bare.tpl` music player?**
|   |   |
|---|---|
| Left click   | play next |
| Right click  | pause/continue |
| Middle click <br />(press wheel)| sequence/shuffle playlist |

**Why don't go straight with existing template techniques, e.g. of Delphi/HFS or Python/HFS?**  
You may have heard about bad side about HFS performance: most because UI/Server threading problem, the other is imperformant template interpretation.  
The former is (hopefully) solved by Node/HFS, so let's do the later.  
And now I want something completely different :D

**Why stay with that weird HFS macro? Shouldn't there be a better thing?**  
I personally think that, reasonable philosophy won't die. By learning from pure faith, we won't lose direction.  
But, though, I have a language idea for macro/template/general-html. It have form, but still a bit unclear.  
Further suggestions are welcome!

**Is it secure enough?**  
Since it's non-production, it yet can't be determined.  
But it's certainly true that so-called "injection" **won't** work!  
*Leave away from those tech imps.* Test your case with good tools like [OWASP ZAP](https://www.zaproxy.org/), *not a mouth*.

<br />

</details>

## Dev

- Prepare: `cd` to repo, `npm install`
- Transpile: `npx tsc`

<details>

<summary>Tips for Linux/*nix</summary>

Symlinking `dist` to plugin folder as `Tradit-TPL` helps.

Under X11 (yes, neither Windows/Wine nor Wayland), HFS can't reload correctly with `npx tsc --watch`, after 2 times.  
Assign a keybinding to your DE (like KDE Plasma) to run `touch /<DEV_PATH_HERE>/Tradit-TPL/dist/plugin.js`. My choice is `Ctrl+Alt+Shift+S`.

</details>

<br />

Far more things are going to be changed, and many macros are not implemented yet.

Don't pay too much attention as for now...

Yawn... Bed time...

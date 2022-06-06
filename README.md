# Tradit-TPL

*Use an HFS 2 'template' in HFS 3* - PRE-ALPHA stage

## Features

- Speed! Always response within 10ms then stream the page  
  (without file sorting, though not implemented yet)
- Different "macro" concept, not interpreted but executed  
  (code describes best; or just feel it)

## Try it out

For it's way too early, not put to HFS "search online" list yet.

0. Wait for [HFS](https://github.com/rejetto/hfs) to release 0.22.3 or later, download & set it up.  
  Couldn't wait anymore? Follow its guide to build, not that difficult.
1. Clone (or download archive of) this repository
2. Copy the `dist` folder to HFS plugin folder, rename as `Tradit-TPL`
3. Launch HFS, go to admin UI, Plugin panel
4. Enable this plugin **and** configure it, pick a template  
  A minimal template `bare.tpl` is inside plugin folder. Use it.
5. Stop & start the plugin again
6. Go to "Shared Files" panel, put some files/folders
7. Browse files. See if it works
8. (With `bare.tpl`) prepare & go to a folder with music files, and enjoy the music player

## Dev

- Prepare: `cd` to repo, `npm install`
- Compile: `npx tsc`

Symlinking `dist` to plugin folder as `Tradit-TPL` helps.

Far more things are going to be changed, and many macros are not implemented yet.

Don't pay too much attention as for now...

Yawn... Bed time...

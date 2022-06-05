# Tradit-TPL

*Use an HFS 2 'template' in HFS 3* - PRE-ALPHA stage

Still in very early development and just say few...

## Try it out

For it's way too early, not in HFS "search online" list yet.

0. Wait for [HFS](https://github.com/rejetto/hfs) to release 0.22.3 or later, download & set it up.
  - Couldn't wait anymore? Follow its guide to build, not that difficult.
1. Clone (or download archive of) this repository
2. Copy the `dist` folder to HFS plugin folder, rename as `Tradit-TPL`
3. Launch HFS, go to admin UI, Plugin panel
4. Enable this plugin **and** configure it, pick a template
  - A minimal template `bare.tpl` is inside plugin folder. Try it.
  - Pick a *simple* kind of template from the forums,  
    notably Throwback / Stripes (They won't fully work yet)
5. Reload the plugin, just click the stop & start (icon)button
6. Go to "Shared Files" panel, put some files/folders
7. Go to root URL. See if it works
8. With `bare.tpl`, prepare & go to a folder with music files, and enjoy the music player

## Dev

- Prepare: `cd` to repo, `npm install`
- Compile: `tsc`

Symlinking `dist` to plugin folder as `Tradit-TPL` helps.

Far more things are going to be changed, and many macros are not implemented yet.

Don't pay too much attention as for now...

### Concepts

Only a handful here. See source for more info.

- Template/Sections/Macros/Groups(aka Quotes) go serialized & assemblized, then being prepared ("curried" to bare functions), finally go to some arrays.
- In macro execution context, for performance, fixed(typed) null value representations are used instead of `null` `undefined` etc.

Yawn... Bed time...

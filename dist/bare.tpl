
[]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HFS</title>
    <link rel="stylesheet" href="/~style.css" />
</head>
<body>
    <main>
        <p>{.breadcrumbs| <a href="%bread-url%">%bread-name%</a> &gt;.}</p>
        <table>
            <thead>
                <tr>
                    <td>Item</td>
                    <td>Last Modified</td>
                    <td>Size</td>
                </tr>
            </thead>
            <tbody>%files%</tbody>
        </table>
    </main>
    <div class="overlay">
        <div id="player" class="hidden">
            <span>🎵 Play</span>
            <span></span>
        </div>
    </div>
    <script src="/~player.js"></script>
</body>
</html>

[files]
%list%

[file]
<tr class="file">
    <td><a href="%item-url%">%item-name%</a></td>
    <td>%item-modified%</td>
    <td><span>%item-size%B</span></td>
</tr>

[folder]
<tr class="folder">
    <td><a href="%item-url%">%item-name%</a></td>
    <td>%item-modified%</td>
    <td><i>folder</i></td>
</tr>

[style.css|public]
/*<style>/**/

:root {
    --front-color: #111;
    --back-color: #fff;
    --link-color: #33f;
}

body {
    margin: 0;
    font-family: 'Noto Sans', 'Segoe UI', sans-serif;
    color: var(--front-color);
    background-color: var(--back-color);
}

a:any-link {
    color: var(--link-color);
    text-decoration: none;
}

main {
    padding: 8px;
    max-width: 50em;
    margin: auto;
    overflow-x: auto;
}

td {
    padding: 4px 8px;
}

table {
    min-width: 100%;
}

table td:nth-child(1) {
    text-align: start;
    width: auto;
}
table td:nth-child(2) {
    text-align: center;
    white-space: nowrap;
    width: 12em;
}
table td:nth-child(3) {
    text-align: end;
    width: 6em;
    white-space: nowrap;
}
table .folder td:nth-child(3) {
    text-align: center;
}

.hidden {
    user-select: none;
    pointer-events: none;
    opacity: 0;
}

.overlay {
    position: fixed;
    width: 100%;
    height: 0;
    left: 0;
    bottom: 0;
    z-index: 1;
}

#player {
    position: fixed;
    left: 8px;
    bottom: 8px;
    padding: 4px 8px;
    border: 1px solid currentColor;
    border-radius: 2px;
    background-color: inherit;
    cursor: pointer;
}
#player :nth-child(1):after {
    content: ' - ';
}

@media (prefers-color-scheme: dark) {
    :root {
        --front-color: #eee;
        --back-color: #333;
        --link-color: #66f;
    }
}

/**/</style>*/

[player.js|public]
//<script>

document.addEventListener('DOMContentLoaded', () => {
    const Format = {
        audio: ['.mp3', '.ogg', '.flac', '.wav'] // many more
    };
    let songs = [];
    let player = document.getElementById('player');
    let player_label = player.querySelector(':nth-child(2)');
    let audio = new Audio();
    let song_index = 0;
    document.querySelectorAll('table .file td:nth-child(1) a').forEach(e => {
        if (Format.audio.some(s => e.href.endsWith(s))) songs.push(e.href);
    });
    if (songs.length !== 0) {
        player.classList.remove('hidden');
        player.addEventListener('click', () => {
            player_label.innerText = decodeURI(audio.src = songs[song_index++]).split('/').at(-1);
            audio.play();
            if (song_index >= songs.length) song_index = 0;
        });
        player.addEventListener('contextmenu', (event) => {
            audio.paused ? audio.play() : audio.pause();
            event.preventDefault();
        });
    }
});

//</script>

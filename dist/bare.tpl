
[]
<!DOCTYPE html>
<!-- Template License: CC0 -->
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HFS</title>
    <link rel="stylesheet" href="/~style.css" />
</head>
<body>
    <main>
        <p>{.replace|<a href="/">/</a>|<a href="/">Home</a>|{.breadcrumbs|<a href="%bread-url%">%bread-name%</a> &gt; .}.}</p>
        %files%
    </main>
    <div class="overlay">
        <div id="player" class="hidden">
            <span>🎵 Play</span>
            <span></span>
        </div>
    </div>
    <div class="blank"></div>
    <footer>
        <p class="hidden"><a href="/~jslicense.html" data-jslicense="1">JavaScript License Information</a></p>
    </footer>
    <script src="/~main.js"></script>
</body>
</html>

[files]
<table>
    <thead>
        <tr>
            <td>Item</td>
            <td>Last Modified</td>
            <td>Size</td>
        </tr>
    </thead>
    <tbody>%list%</tbody>
</table>

[file]
<tr class="file">
    <td><a href="%item-url%">%item-name%</a></td>
    <td>%item-modified%</td>
    <td>%item-size%B</td>
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
    white-space: nowrap;
}

table tr {
    outline: 1px solid transparent;
    transition: outline 0.3s ease;
}
table tr:hover {
    outline: 1px solid var(--front-color);
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
    text-align: center;
    width: 5em;
}
table tr.file td:nth-child(3) {
    text-align: end;
}
footer {
    font-size: small;
    text-align: center;
}

.blank {
    height: 10em;
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

[main.js|public]
//<script>
const Format = {
    audio: ['.mp3', '.ogg', '.flac', '.wav']    // and many more
};

function loadScript(path) {
    let script = document.createElement('script');
    script.src = path;
    document.body.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
    if (Format.audio.some(s => document.querySelector('a[href$="' + s + '"]')))
        loadScript('/~player.js');
});

//</script>

[player.js|public]
//<script>

(function() {
    let songs = [];
    let songs_shuffled;
    let shuffle = false;
    let player = document.getElementById('player');
    let player_label = player.querySelector(':nth-child(2)');
    let audio = new Audio();
    let song_index = 0;
    document.querySelectorAll('table .file td:nth-child(1) a').forEach(e => {
        if (Format.audio.some(s => e.href.endsWith(s))) songs.push(e.href);
    });
    songs_shuffled = songs.concat().sort((a, b) => Math.random() - 0.5);
    const play_next = () => {
        player_label.innerText = decodeURI(audio.src = (shuffle ? songs_shuffled : songs)[song_index++]).split('/').at(-1);
        audio.play();
        if (song_index >= songs.length) song_index = 0;
    }
    if (songs.length !== 0) {
        player.classList.remove('hidden');
        player.addEventListener('click', play_next);
        player.addEventListener('contextmenu', (event) => {
            audio.paused ? audio.play() : audio.pause();
            event.preventDefault();
        });
        player.addEventListener('auxclick', (event) => {
            shuffle = !shuffle;
            play_next();
            event.preventDefault();
        });
        audio.addEventListener('ended', play_next);
    }
})();

//</script>

[jslicense.html|public]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JavaScript License Information</title>
</head>
<body>
    <table id="jslicense-labels1">
        <tbody>
            <tr>
                <td><a href="/~main.js">main.js</a></td>
                <td><a href="http://creativecommons.org/publicdomain/zero/1.0/legalcode">CC0-1.0</a></td>
                <td><a href="/~main.js">main.js</a></td>
            </tr>
            <tr>
                <td><a href="/~player.js">player.js</a></td>
                <td><a href="http://creativecommons.org/publicdomain/zero/1.0/legalcode">CC0-1.0</a></td>
                <td><a href="/~player.js">player.js</a></td>
            </tr>
        </tbody>
    </table>
</body>
</html>

[not found]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Not Found</title>
    <link rel="stylesheet" href="/~style.css" />
</head>
<body>
    <p>Not Found</p>
    <p><a href="../">&lt; Go Back</a></p>
</body>
</html>


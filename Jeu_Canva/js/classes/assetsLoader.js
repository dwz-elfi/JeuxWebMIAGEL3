export async function loadAssets(assetsToLoadURLs) {
    let result = await loadAssetsUsingHowlerAndNoXhr(assetsToLoadURLs);
    console.log("Tout est chargé !");
    return result;
}

function isImage(url) {
    return (url.match(/\.(jpeg|jpg|gif|png|avif)$/) != null);
}

function isAudio(url) {
    return (url.match(/\.(mp3|ogg|wav)$/) != null);
}

async function loadAssetsUsingHowlerAndNoXhr(assetsToBeLoaded) {
    var assetsLoaded = {};
    var loadedAssets = 0;
    var numberOfAssetsToLoad = 0;

    return new Promise((resolve) => {
        // Compter combien de fichiers on doit charger
        for (var name in assetsToBeLoaded) {
            numberOfAssetsToLoad++;
        }

        console.log("Nombre d'assets à charger : " + numberOfAssetsToLoad);

        // Fonction appelée quand une IMAGE est chargée
        var ifLoad = function () {
            loadedAssets++;
            console.log("Asset chargé : " + loadedAssets + "/" + numberOfAssetsToLoad);
            if (loadedAssets >= numberOfAssetsToLoad) {
                resolve(assetsLoaded); 
            }
        };

        for (name in assetsToBeLoaded) {
            var url = assetsToBeLoaded[name].url;
            console.log("Chargement de " + url);
            
            if (isImage(url)) {
                assetsLoaded[name] = new Image();
                assetsLoaded[name].onload = ifLoad;
                assetsLoaded[name].src = url;
            } else {
                // Chargement AUDIO (avec Howler)
                assetsLoaded[name] = new Howl({
                    src: [url],
                    buffer: assetsToBeLoaded[name].buffer,
                    loop: assetsToBeLoaded[name].loop,
                    autoplay: false,
                    volume: assetsToBeLoaded[name].volume,
                    onload: function () {
                        loadedAssets++;
                        console.log("Audio chargé : " + loadedAssets + "/" + numberOfAssetsToLoad);
                        if (loadedAssets >= numberOfAssetsToLoad) {
                            resolve(assetsLoaded);
                        }
                    }
                });
            }
        }
    });
}
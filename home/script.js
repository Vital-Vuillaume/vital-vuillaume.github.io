const contentCube = document.querySelector('.contentCube');

function injectCube(imageSrc, titleText, link) {
    
    contentCube.innerHTML += `
        <div class="cubeBlock">
            <div class="cubeContainer">
                <div class="cube">
                    <a class="face front" href="${link}">
                        <img class="img" src="${imageSrc}" alt="site server">
                    </a>
                    <a class="face back" href="${link}">
                        <img class="img" src="${imageSrc}" alt="site server">
                    </a>
                    <a class="face right" href="${link}">
                        <img class="img" src="${imageSrc}" alt="site server">
                    </a>
                    <a class="face left" href="${link}">
                        <img class="img" src="${imageSrc}" alt="site server">
                    </a>
                    <a class="face top" href="${link}">
                        <img class="img" src="${imageSrc}" alt="site server">
                    </a>
                    <a class="face bottom" href="${link}">
                        <img class="img" src="${imageSrc}" alt="site server">
                    </a>
                </div>
            </div>


            <div class="block titreCube">
                <div class="link">
                    <a href="${link}">${titleText}</a>
                </div>
            </div>
        </div>
    `;
}

injectCube("../note/images/icone.png", "Note", "./note");

injectCube("../profile/images/icone.png", "Profile", "./profile");
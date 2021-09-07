const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const data = urlParams.get('data');
const imageProperties = JSON.parse(data).imageProperties || {};
const imageUrl = imageProperties.originalSrc || JSON.parse(data).imageUrl;

let resizedImage = "";
let cropAspectRatio = imageProperties.crop || '1:1';
let fixedValue = imageProperties.fixed || 'xxs';
let responsiveValue = imageProperties.responsive || 'full_width';
let fixed = document.getElementById("fixed");
let resize = document.getElementById("resize");
let responsive = document.getElementById("responsive");
let crop = document.getElementById("crop");
let cropAspectRatioButton = document.getElementById("cropAspectRatioButton");
let dropdowns = document.querySelectorAll('.dropdown');

const fixedOptions = {
    xxs: "32px",
    xs: "64px",
    s: "128px",
    m: "200px",
    l: "304px",
    xl: "416px",
    xxl: "600px",
    "720": "720px",
    "1080": "1080px",
    "1440": "1440px",
};

function onChangeResizeCrop(selectedValue) {
    cropAspectRatioButton.disabled = selectedValue === "resize" ? true : false;
    getresizedImage();
}

resize.addEventListener("change", () => onChangeResizeCrop("resize"));
crop.addEventListener("change", () => onChangeResizeCrop("crop"));

if (imageProperties.crop) {
    crop.click();
    document.getElementById('cropDropDownValue').innerText = imageProperties.crop;
}

function onChangeFixedResponsive(selectedValue) {
    fixedDropdown.style.display = selectedValue === "fixed" ? "block" : "none";
    responsiveDropdown.style.display = selectedValue === "responsive" ? "block" : "none";
    getresizedImage();
}

fixed.addEventListener("change", () => onChangeFixedResponsive("fixed"));
responsive.addEventListener("change", () => onChangeFixedResponsive("responsive"));

if (imageProperties.responsive) {
    responsive.click();
    document.getElementById('responsiveValue').innerText = document.getElementById(imageProperties.responsive).innerText;
} else if (imageProperties.fixed) {
    document.getElementById('fixedValue').innerText = document.getElementById(imageProperties.fixed).innerText;
}

document.body.onclick = (e) => {
    if (e.target.nodeName !== 'BUTTON') {
        let openedDropdown = document.getElementsByClassName('open')[0];
        if (openedDropdown) {
            openedDropdown.classList.remove('open');
        }
    }
}

dropdowns.forEach((dropdown) => {
    dropdown.onclick = (e) => {
        e.stopPropagation();
        let openedDropdown = document.getElementsByClassName('open')[0];
        if (dropdown.className.includes('open')) {
            dropdown.classList.remove('open');
        } else {
            if (openedDropdown) {
                openedDropdown.classList.remove('open');
            }
            if (!(dropdown.children[0].id === 'cropAspectRatioButton') || !cropAspectRatioButton.disabled) {
                dropdown.classList.add('open');
            } 
        }
    }
})

document.getElementById('cropAspectRatios').onclick = (event) => {
    document.getElementById('cropDropDownValue').innerText = cropAspectRatio = event.target.innerText;
    getresizedImage();
}
document.getElementById('fixedOptions').onclick = (event) => {
    fixedValue = event.target.id;
    document.getElementById('fixedValue').innerText = event.target.innerText;
    getresizedImage();
}
document.getElementById('responsiveOptions').onclick = (event) => {
    responsiveValue = event.target.id;
    document.getElementById('responsiveValue').innerText = event.target.innerText;
    getresizedImage();
}

function getresizedImage () {
    let size = fixed.checked ? fixedValue : responsiveValue;
    if (resize.checked) {
        resizedImage = window.parent.buildfire.imageLib.resizeImage(imageUrl, {
            size: size,
            aspect: "1:1",
        });
    } else {
        resizedImage = window.parent.buildfire.imageLib.cropImage(imageUrl, {
            size: size,
            aspect: cropAspectRatio,
        });
    }
    let img = `<img width="${
        fixed.checked ? fixedOptions[fixedValue] : ""
    }" src="${resizedImage}" />`
    document.getElementById('imageDiv').innerHTML = "";
    document.getElementById('imageDiv').innerHTML= img;
}

getresizedImage();


window.addEventListener('message', function (event) {
    let imageAspects = {
        resize: resize.checked ? true : false,
        crop: !resize.checked ? cropAspectRatio : '',
        fixed: fixed.checked ? fixedValue : '',
        responsive: !fixed.checked ? responsiveValue : '',
        originalSrc: imageUrl,
    }
    let stringifiedImageAspects = escape(JSON.stringify(imageAspects));
    let imageWidth = fixed.checked ? fixedOptions[fixedValue] : '';
    // to get rid of the 'px' at the end of the image width string
    imageWidth = imageWidth ? imageWidth.slice(0, imageWidth.length - 2) : '';
    let imageData = {
        width: imageWidth,
        src: resizedImage,
        imageAspects: stringifiedImageAspects
    }
    if (event.data.message === 'getImage') {
        window.parent.postMessage({
            mceAction: 'setImage',
            data: {
                imageData
            }
        }, origin);
    } else if (event.data.message === 'getImageToInsertAction') {
        window.parent.postMessage({
            mceAction: 'setImageAction',
            data: {
                imageData
            }
        }, origin);
    }
});
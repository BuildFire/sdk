let layouts;
let selectedLayout;
let originalLayoutData;
let mainContainer = document.getElementById('main');

const queryString = window.location.search;
if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    const data = urlParams.get('data');
    originalLayoutData = JSON.parse(data).layoutData;
}

fetch('./layouts.json')
    .then(response => response.json())
    .then((data) => {
        layouts = data;
        render(data);
    })
    .catch(error => console.log(error));

function render(layouts) {
    if (originalLayoutData) {
        layouts = layouts.filter((layout) => {
            return layout.htmlUrl === originalLayoutData.htmlUrl;
        })
    }
    let rowDiv = document.createElement('div');
    layouts.forEach((item, index) => {
        let imageDiv = document.createElement('div');
        if (index === 0 && !originalLayoutData) {
            selectedLayout = item;
            imageDiv.classList.add('active');
        } else if (originalLayoutData) {
            if (originalLayoutData.id === item.id) {
                selectedLayout = item;
                imageDiv.classList.add('active');
            }
        }
        imageDiv.classList.add('imageDiv');
        let image = document.createElement('img');
        image.src = item.imageUrl;
        image.onclick = () => {
            document.getElementsByClassName('active')[0].classList.remove('active');
            imageDiv.classList.add('active');
            selectLayout(item.id);
        }
        imageDiv.appendChild(image);
        if (index != 0 && index % 3 === 0) {
            mainContainer.appendChild(rowDiv);
            rowDiv = document.createElement('div');
            rowDiv.appendChild(imageDiv);
        } else {
            rowDiv.appendChild(imageDiv);
        }
    })
    mainContainer.appendChild(rowDiv);
}

function selectLayout(layoutId) {
    selectedLayout = layouts.find((layout) => {
        return layoutId === layout.id;
    });
}
window.addEventListener('message', function (event) {
    if (event.data.message === 'getLayout') {
        Promise.all([
            fetch(selectedLayout.cssUrl),
            fetch(selectedLayout.htmlUrl)
        ]).then(function (responses) {
            return Promise.all(responses.map(function (response) {
                return response.text();
            }));
        }).then(function (data) {
            selectedLayout.cssContent = data[0];
            selectedLayout.htmlContent = data[1];
            window.parent.postMessage({
                mceAction: 'insertLayout',
                data: {
                    content: selectedLayout
                }
            }, origin);
        }).catch(function (error) {
            console.log(error);
        });
    }
});

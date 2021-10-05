let buttonAndLinksStyles = ['primary', 'success', 'info', 'warning', 'default', 'danger'];
let dialogData = {
    'button' : {buttonStyle : 'primary', type: 'button'},
    'link': {buttonStyle : 'primary', type: 'link'},
    chosenType: 'button'
};
let elementStyle = 'primary';
const queryString = window.location.search;
let isEditing = queryString ? true : false;
if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    const data = urlParams.get('data');
    const classes = JSON.parse(data).classes;
    let elementType = classes.includes('bf-btn') ? 'button' : 'link';
    dialogData.chosenType = elementType;
    elementStyle = getElementStyle(classes) || elementStyle;
    dialogData[elementType].buttonStyle = elementStyle; 
}
let selectedStyleIndex = buttonAndLinksStyles.indexOf(elementStyle);


if (window.parent.document.getElementById('bfWidgetTheme')) {
    let stylesClone = window.parent.document.getElementById('bfWidgetTheme').cloneNode(true);
    document.head.appendChild(stylesClone);
}

function render() {
    function createElements(type) {
        let container = document.getElementById(type === 'buttons' ? 'buttonsContainer' : 'linksContainer');
        buttonAndLinksStyles.forEach((style, index) => {
            let columnDiv = document.createElement('div');
            let buttonOrLinkDiv = document.createElement('div');
            columnDiv.className = 'col-xs-6 pull-left margin-top-20';
            let buttonOrLink = document.createElement('a');
            buttonOrLink.className = type === 'buttons' ? `bf-btn bf-btn-${style} btns-width` : `bf-text-${style}`;
            let itemToClick = type === 'buttons' ? buttonOrLink : buttonOrLinkDiv;
            itemToClick.onclick = () => {
                selectButtonType(style, type === 'buttons' ? 'button' : 'link');
                resetBorder(type === 'buttons' ? 'button' : 'link');
                buttonOrLinkDiv.classList.add(`bf-border-${style}`, 'active');
            }
            buttonOrLink.innerText = `${style} ${type === 'buttons' ? 'button' : 'link'}`;
            buttonOrLinkDiv.appendChild(buttonOrLink);
            columnDiv.appendChild(buttonOrLinkDiv);
            container.appendChild(columnDiv);
        });
    }
    createElements('buttons');
    createElements('links');
    document.getElementById('main').style.display = 'block';
}

render();
if (dialogData.chosenType === 'button') {
    document.getElementById('buttons').checked = true;
    document.getElementById('buttonsContainer').children[selectedStyleIndex].children[0].className = `bf-border-${elementStyle} active`;
    document.getElementById('linksContainer').children[0].children[0].className = `bf-border-primary active`;
    document.getElementById('buttonsContainer').style.display = 'block';
    if (isEditing) {
        document.getElementById('links').disabled = true;
    }
} else {
    document.getElementById('links').checked = true;
    document.getElementById('linksContainer').children[selectedStyleIndex].children[0].className = `bf-border-${elementStyle} active`;
    document.getElementById('buttonsContainer').children[0].children[0].className = `bf-border-primary active`;
    document.getElementById('linksContainer').style.display = 'block';
    if (isEditing) {
        document.getElementById('buttons').disabled = true;
    }
}

const resetBorder = (type) => {
    if (type === 'button') {
        document.querySelector('#buttonsContainer .active').className = '';
    } else {
        document.querySelector('#linksContainer .active').className = '';
    }
}
const selectButtonType = (buttonStyle, type) =>  {
    dialogData[dialogData.chosenType].buttonStyle = buttonStyle;
    dialogData[dialogData.chosenType].type = type;
}
document.getElementsByName('buttonsTypes').forEach((button) => {
    button.onclick = (e) => {
        if (e.target.value === 'links') {
            dialogData.chosenType = 'link';
            document.querySelector('#buttonsContainer').style.display = 'none';
            document.querySelector('#linksContainer').style.display = 'block';
        } else if (e.target.value === 'buttons') {
            dialogData.chosenType = 'button';
            document.querySelector('#linksContainer').style.display = 'none';
            document.querySelector('#buttonsContainer').style.display = 'block';
        }
    }
});
window.addEventListener('message', function (event) {
    if (event.data.message === 'getButtonData') {
        let result = dialogData[dialogData.chosenType];
        window.parent.postMessage({
            mceAction: 'setButtonData',
            data: {
                content: result
            }
        }, origin);
    }
});

function getElementStyle(classes) {
    let elementStyle = '';
    buttonAndLinksStyles.forEach((item) => {
        if (dialogData.chosenType === 'button') {
            if (classes.includes(`bf-btn-${item}`)) {
                elementStyle = item;
            }
        } else if (dialogData.chosenType === 'link') {
            if (classes.includes(`bf-text-${item}`)) {
                elementStyle = item;
            }
        }
    })
    return elementStyle;
}
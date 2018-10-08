var svg;

$(window).on('load', function() {
    svg = $('svg')[0];
    setSVGHeight();
    adjustPitcherNames('home');
    adjustPitcherNames('away');
})

function setSVGHeight() {
    const Y_BUFFER = 30;
    let boxHeight = $(svg).find('#away_team').find('rect')[0].height.baseVal.value
    let maxNameY = Math.max(...getNamesY('.home-pitcher-name').concat(getNamesY('.away-pitcher-name')))
    $(svg).attr('height', Math.max(boxHeight, maxNameY) + Y_BUFFER);
}

function getNamesY(nameClass) {
    return $(svg).find(nameClass).toArray().map(name => name.getBBox().y + name.getBBox().width / 2)
}

function getHashes(hashClass) {
    return $(svg).find(hashClass).toArray().map(line => line.y1.baseVal.value)
}

function getHashObjects(hashClass) {
    return $(svg).find(hashClass).toArray()
}

function adjustPitcherNames(side) {
    const BUFFER = 40
    let hashes = getHashes('.' + side + '-pitcher-hash')
    let hashObjects = $(svg).find('.' + side + '-pitcher-hash').toArray()
    let names = $(svg).find('.' + side + '-pitcher-name').toArray()
    for (let i = 0; i < names.length; i++) {
        let name = names[i]
        let nameBox = name.getBBox()

        if (nameBox.y - nameBox.width / 2 < hashes[i]) {
            var level = 1
            for (let j = 0; j < i; j++) {
                let pBox = names[j].getBBox()
                var xCollide
                if (name === 'home')
                    xCollide = pBox.x - pBox.height / 2 > nameBox.x
                else
                    xCollide = pBox.x - pBox.height / 2 < nameBox.x
                let yCollide = pBox.y + pBox.width / 2 + 10 > nameBox.y - nameBox.width / 2
                if (xCollide && yCollide)
                    level += 1
            }
            y = name.y.baseVal[0].value
            if (side === 'home') {
                newX = name.x.baseVal[0].value + nameBox.height * level
                $(name).attr('x', newX)
                $(name).attr('transform', 'rotate(90,' + newX + ',' + y + ')')
            } else {
                newX = name.x.baseVal[0].value - nameBox.height * level
                $(name).attr('x', newX)
                $(name).attr('transform', 'rotate(-90,' + newX + ',' + y + ')')
            }
        } else if (hashes[i + 1] - hashes[i] - nameBox.width > BUFFER) {
            // Draw lines between hashes
            let x = (hashObjects[i].x1.baseVal.value + hashObjects[i].x2.baseVal.value) / 2
            var transform
            if (side === 'home')
                transform = 'translate(0, 0) scale(1, 1)'
            else
                transform = 'translate(600, 0) scale(-1, 1)'
            let y1 = hashObjects[i].y1.baseVal.value
            let y2 = nameBox.y - nameBox.width / 2 + 5
            appendLine(x, y1, x, y2, transform, 'team-box')
            let y3 = nameBox.y + nameBox.width / 2 + 10
            let y4 = hashObjects[i + 1].y1.baseVal.value
            appendLine(x, y3, x, y4, transform, 'team-box')
        }

    }
}

function appendLine(x1, y1, x2, y2, transform, className) {
    $(SVG('line')).attr('transform', transform)
                  .attr('x1', x1).attr('y1', y1)
                  .attr('x2', x2).attr('y2', y2)
                  .attr('class', className)
                  .appendTo(svg)
}

function SVG(tag) {
        return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

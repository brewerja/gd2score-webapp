/* global svg:true $:false window:false document:false */

function getNames(side) {
  return $(svg).find(`.${side}-pitcher-name`).toArray();
}

function getX(text) {
  return text.x.baseVal[0].value;
}

function getY(text) {
  return text.y.baseVal[0].value;
}

function getNamesY(side) {
  return getNames(side).map(name => getY(name) + name.getBBox().width / 2);
}

function getHashes(side) {
  return $(svg).find(`.${side}-pitcher-hash`).toArray();
}

function getTop(obj) {
  return getY(obj) - obj.getBBox().width / 2;
}

function getBottom(obj) {
  return getY(obj) + obj.getBBox().width / 2;
}

function getNewX(names, i, side) {
  const shift = (side === 'home' ? 15 : -15);
  let nameX = getX(names[i]) + shift;
  for (let j = 0; j < i; j += 1) {
    const pName = names[j];
    const xCollide = nameX === getX(pName);
    const yCollide = getBottom(pName) > getTop(names[i]);

    if (xCollide && yCollide) nameX += shift;
  }
  return nameX;
}

function shiftName(name, side, newX) {
  $(name).attr('x', newX);
  const rotation = (side === 'home' ? '90' : '-90');
  $(name).attr('transform', `rotate(${rotation},${newX},${getY(name)})`);
}

function isGapWideEnoughToDrawLines(name, hash) {
  const BUFFER = 10;
  return getY(name) - name.getBBox().width / 2 - hash.y1.baseVal.value > BUFFER;
}

function SVG(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function appendLine(x1, y1, x2, y2, transform, className) {
  $(SVG('line')).attr('transform', transform)
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2)
    .attr('class', className)
    .appendTo(svg);
}

function drawLinesBetweenHashes(name, hashes, i, side) {
  const x = (hashes[i].x1.baseVal.value + hashes[i].x2.baseVal.value) / 2;
  let transform;
  if (side === 'home') transform = 'translate(0, 0) scale(1, 1)';
  else transform = 'translate(600, 0) scale(-1, 1)';
  const BUFFER = 5;
  const nameBox = name.getBBox();
  const y1 = hashes[i].y1.baseVal.value;
  const y2 = getY(name) - nameBox.width / 2 - BUFFER;
  appendLine(x, y1, x, y2, transform, 'team-box');
  const y3 = getY(name) + nameBox.width / 2 + BUFFER;
  const y4 = hashes[i + 1].y1.baseVal.value;
  appendLine(x, y3, x, y4, transform, 'team-box');
}

function isNameWiderThanAdjacentHashMarks(name, hash) {
  const BUFFER = 5;
  return getY(name) - name.getBBox().width / 2 - BUFFER < hash.y1.baseVal.value;
}

function adjustPitcherNames(side) {
  const hashes = getHashes(side);
  const names = getNames(side);

  for (let i = 0; i < names.length; i += 1) {
    if (isNameWiderThanAdjacentHashMarks(names[i], hashes[i])) {
      const newX = getNewX(names, i, side);
      shiftName(names[i], side, newX);
    } else if (isGapWideEnoughToDrawLines(names[i], hashes[i])) {
      drawLinesBetweenHashes(names[i], hashes, i, side);
    }
  }
}

function setSVGHeight() {
  const Y_BUFFER = 30;
  const boxHeight = $(svg).find('#away_team').find('rect')[0].height.baseVal.value;
  const maxNameY = Math.max(...getNamesY('home').concat(getNamesY('away')));
  $(svg).attr('height', Math.max(boxHeight, maxNameY) + Y_BUFFER);
}

$(window).on('load', () => {
  [svg] = $('svg');
  setSVGHeight();
  adjustPitcherNames('home');
  adjustPitcherNames('away');
});

/* global $:false window:false document:false */

$(window).on('load', () => {
  let svg;

  function getX(text) {
    return text.x.baseVal[0].value;
  }

  function getY(text) {
    return text.y.baseVal[0].value;
  }

  function getNames(side) {
    return $(svg).find(`.${side}-pitcher-name`).toArray();
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

  function shiftName(names, i, side) {
    const newX = getNewX(names, i, side);
    const name = names[i];
    $(name).attr('x', newX);
    const rotation = (side === 'home' ? '90' : '-90');
    $(name).attr('transform', `rotate(${rotation},${newX},${getY(name)})`);
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

  function isGapWideEnoughToDrawLines(name, hash) {
    const BUFFER = 10;
    return getY(name) - name.getBBox().width / 2 - hash.y1.baseVal.value > BUFFER;
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
        shiftName(names, i, side);
      } else if (isGapWideEnoughToDrawLines(names[i], hashes[i])) {
        drawLinesBetweenHashes(names[i], hashes, i, side);
      }
    }
  }

  function setSVGHeight() {
    const Y_BUFFER = 30;
    const boxHeight = $(svg).find('#away_team').find('rect')[0].height.baseVal.value;
    const maxNameY = Math.max(...getNamesY('home').concat(getNamesY('away')));
    const totalHt = Math.max(boxHeight, maxNameY) + Y_BUFFER;
    $(svg).attr('viewBox', `0 0 600 ${totalHt}`);
  }

  function finalizeDrawing() {
    [svg] = $('#scorecard').find('svg');
    if (svg) {
      setSVGHeight();
      adjustPitcherNames('home');
      adjustPitcherNames('away');
    }
  }

  function getOptions() {
    const options = {};
    $.map($('#games option'), (e) => { options[e.value] = e.text; });
    delete options.placeholder;
    return options;
  }

  function getPlaceholderText(games) {
    const numGames = Object.keys(games).length;
    if (numGames === 0) {
      return 'No Games';
    } if (numGames === 1) {
      return '1 Game';
    }
    return `${numGames} Games`;
  }

  function populateDropdown(games) {
    const dropdown = $('#games');
    dropdown.children().remove();

    dropdown.append($('<option />')
      .val('placeholder')
      .text(getPlaceholderText(games))
      .prop('selected', true)
      .prop('disabled', true)
      .prop('hidden', true));
    $.each(games, (gid, awayAtHome) => {
      dropdown.append($('<option />').val(gid).text(awayAtHome));
    });
  }

  function setGamesDropdown(dateStr, callback) {
    $.getJSON(`games/${dateStr}`, (games) => {
      populateDropdown(games);
      if (callback !== undefined) callback();
    });
  }

  function getGame(gid) {
    $.getJSON(`svg/${gid}`, (data) => {
      $('#scorecard').html(data.svg);
      finalizeDrawing();
      if (data.inProgress) {
        $('#refresh-button').attr('hidden', false);
      } else {
        $('#refresh-button').attr('hidden', true);
      }
    });
  }

  function disableForm() {
    $('.flatpicker').prop('disabled', true);
    $('#games').prop('disabled', true);
    $('#refresh-button').attr('disabled', true);
  }

  function enableForm() {
    $('.flatpicker').prop('disabled', false);
    $('#games').prop('disabled', false);
    $('#refresh-button').attr('disabled', false);
  }

  const datepicker = $('.flatpickr').flatpickr({
    defaultDate: 'today',
    altInput: true,
    altFormat: 'F j, Y',
    maxDate: 'today',
    onChange(selectedDates, dateStr) {
      $('#refresh-button').attr('hidden', true);
      disableForm();
      setGamesDropdown(dateStr);
      enableForm();
    },
  });

  function getSelectedDate() {
    return datepicker.element.value;
  }

  function initDate() {
    const date = $('form').data('date');
    if (date) datepicker.setDate(date);
  }

  function initGame() {
    const currentGame = $('form').data('current-game');
    if (currentGame) {
      $('#games').val(currentGame);
      getGame(currentGame);
    } else {
      $('#games').val('placeholder');
      $('#scorecard').html('');
    }
  }

  $('#games').change(() => {
    const gid = $('#games').val();
    $('#scorecard').html('');
    getGame(gid);
    const stateObj = { gid, date: getSelectedDate(), games: getOptions() };
    window.history.pushState(stateObj, null, gid);
  });

  $('#refresh-button').click(() => {
    disableForm();
    getGame($('#games').val());
    enableForm();
  });

  window.addEventListener('popstate', (e) => {
    if (e.state === null) {
      initDate();
      setGamesDropdown(getSelectedDate(), initGame);
    } else {
      datepicker.setDate(e.state.date);
      populateDropdown(e.state.games);
      $('#games').val(e.state.gid);
      $('#scorecard').html('');
      getGame(e.state.gid);
    }
  });

  initDate();
  initGame();
});

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
    const Y_BUFFER = 10;
    const awayRect = $(svg).find('#away_team').find('rect')[0];
    const boxTopY = awayRect.y.baseVal.value
    const boxHeight = awayRect.height.baseVal.value;
    const maxNameY = Math.max(...getNamesY('home').concat(getNamesY('away')));
    const totalHt = Math.max(boxHeight, maxNameY) + boxTopY + Y_BUFFER;
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

  function getPlaceholderText(numGames) {
    if (numGames === 0) {
      return 'No Games';
    } if (numGames === 1) {
      return '1 Game';
    }
    return `${numGames} Games`;
  }

  function setDropdownPlaceholder() {
    const dropdown = $('#games');
    const numGames = dropdown.children().length;
    dropdown.prepend($('<option />')
      .val('placeholder')
      .text(getPlaceholderText(numGames))
      .prop('selected', true)
      .prop('disabled', true)
      .prop('hidden', true));
  }

  function populateDropdown(games) {
    const dropdown = $('#games');
    dropdown.children().remove();

    $.each(games, (gid, awayAtHome) => {
      dropdown.append($('<option />').val(gid).text(awayAtHome));
    });
    setDropdownPlaceholder();
  }

  function disableForm() {
    $('input.flatpickr').prop('disabled', true);
    $('#games').prop('disabled', true);
    $('#refresh-button').attr('disabled', true);
  }

  function enableForm() {
    $('input.flatpickr').prop('disabled', false);
    $('#games').prop('disabled', false);
    $('#refresh-button').attr('disabled', false);
  }

  function setGamesDropdown(dateStr, callback) {
    disableForm();
    $.getJSON(`games/${dateStr}`, (games) => {
      populateDropdown(games);
      enableForm();
      if (callback !== undefined) callback();
    });
  }

  function getGame(gid) {
    disableForm();
    $.getJSON(`svg/${gid}`, (data) => {
      $('#scorecard').html(data.svg);
      finalizeDrawing();
      if (data.inProgress) {
        $('#refresh-button').attr('hidden', false);
      } else {
        $('#refresh-button').attr('hidden', true);
      }
      enableForm();
      console.log(data.link);
    });
  }

  const datepicker = $('.flatpickr').flatpickr({
    defaultDate: 'today',
    altInput: true,
    altFormat: 'F j, Y',
    maxDate: 'today',
    onChange(selectedDates, dateStr) {
      $('#refresh-button').attr('hidden', true);
      setGamesDropdown(dateStr);
    },
  });

  function getSelectedDate() {
    return datepicker.element.value;
  }

  function formatDate() {
    const date = new Date();
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  }

  function initDate() {
    const date = $('form').data('date');
    if (date) {
        datepicker.setDate(date);
    } else {
        const dateStr = formatDate();
        datepicker.setDate(dateStr);
        setGamesDropdown(dateStr);
    }
  }

  function initGame() {
    const currentGame = $('form').data('current-game');
    if (currentGame) {
      $('#games').val(currentGame);
      getGame(currentGame);
    } else {
      $('#games').val('placeholder');
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
    getGame($('#games').val());
  });

  window.addEventListener('popstate', (e) => {
    $('#scorecard').html('');
    if (e.state === null) {
      initDate();
      setGamesDropdown(getSelectedDate(), initGame);
    } else {
      datepicker.setDate(e.state.date);
      populateDropdown(e.state.games);
      $('#games').val(e.state.gid);
      getGame(e.state.gid);
    }
  });

  initDate();
  setDropdownPlaceholder();
  initGame();
});

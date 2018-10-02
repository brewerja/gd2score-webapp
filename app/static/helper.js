$(window).on('load', function() {
    var svg = $('svg')[0];
    setHeight(svg);
})

function setHeight(svg) {
    const Y_BUFFER = 30;
    let height = $(svg).find('#away_team').find('rect')[0].height.baseVal.value
    $(svg).attr('height', height + Y_BUFFER);
}

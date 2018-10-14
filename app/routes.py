import urllib

from flask import render_template, Markup, abort, jsonify
from app import app

import gd2score

game_builder = gd2score.GameBuilder()
draw_scorecard = gd2score.DrawScorecard()


@app.route('/')
@app.route('/<gid>')
def index(gid=None):
    if gid:
        try:
            game = game_builder.build(gid)
            svg = draw_scorecard.draw(game).tostring()
        except (ValueError, urllib.error.HTTPError):
            return abort(404)
        return render_template('index.html', svg=Markup(svg))
    else:
        return render_template('index.html')


@app.route('/svg/<gid>')
def svg(gid):
    game = game_builder.build(gid)
    svg = draw_scorecard.draw(game).tostring()
    return jsonify({'svg': svg})


@app.route('/games/<year>-<month>-<day>')
def get_games(year, month, day):
    d = {'games': gd2score.list_game_ids(int(year), int(month), int(day))}
    return jsonify(d)


@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

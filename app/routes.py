import re
import urllib
import datetime

from flask import render_template, Markup, abort, jsonify
from app import app

import gd2score

game_builder = gd2score.GameBuilder()
draw_scorecard = gd2score.DrawScorecard()


@app.route('/')
def index():
    d = datetime.datetime.now()
    games = gd2score.get_games(d.year, d.month, d.day)
    while not games:
        d = d - datetime.timedelta(days=1)
        games = gd2score.get_games(d.year, d.month, d.day)
    return render_template('index.html', games=games,
                           date='%d-%d-%d' % (d.year, d.month, d.day))


@app.route('/<string:gid>')
def get_game(gid=None):
    try:
        year, month, day = gd2score.parse_gid_for_date(gid)
        games = gd2score.get_games(year, month, day)
        return render_template('index.html', date=f'{year}-{month}-{day}',
                               games=games, current_game=gid)
    except (ValueError, urllib.error.HTTPError):
        return abort(404)


@app.route('/svg/<string:gid>')
def svg(gid):
    game = game_builder.build(gid)
    svg = draw_scorecard.draw(game).tostring()
    return jsonify({'svg': svg})


@app.route('/games/<int:year>-<int:month>-<int:day>')
def get_games(year, month, day):
    return jsonify(gd2score.get_games(year, month, day))


@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

import re
import urllib
import datetime

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
            m = re.match(gd2score.GID_REGEX, gid)
            if m:
                year = int(m.group('year'))
                month = int(m.group('month'))
                day = int(m.group('day'))
                games = gd2score.get_games(year, month, day)
                game = game_builder.build(gid)
                svg = draw_scorecard.draw(game).tostring()
                date = '%d-%d-%d' % (year, month, day)
                return render_template('index.html', svg=Markup(svg),
                                       games=games, date=date, currentGame=gid)
            else:
                return abort(404)
        except (ValueError, urllib.error.HTTPError):
            return abort(404)
    else:
        d = datetime.datetime.now()
        games = gd2score.get_games(d.year, d.month, d.day)
        while not games:
            d = d - datetime.timedelta(days=1)
            games = gd2score.get_games(d.year, d.month, d.day)
        date = '%d-%d-%d' % (d.year, d.month, d.day)
        return render_template('index.html', games=games, date=date)


@app.route('/svg/<gid>')
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

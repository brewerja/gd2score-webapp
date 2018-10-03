from flask import render_template, Markup, abort
from app import app

import gd2score

game_builder = gd2score.GameBuilder()
draw_scorecard = gd2score.DrawScorecard()


@app.route('/')
def index(gid=None):
    return render_template('index.html')


@app.route('/<gid>')
def game(gid):
    try:
        game = game_builder.build(gid)
        svg = draw_scorecard.draw(game).tostring()
    except ValueError:
        return abort(404)
    return render_template('game.html', svg=Markup(svg))


@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

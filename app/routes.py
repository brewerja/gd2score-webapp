from flask import render_template, Markup
from app import app

import gd2score

game_builder = gd2score.GameBuilder()
draw_scorecard = gd2score.DrawScorecard()


@app.route('/')
@app.route('/index')
def index():
    game = game_builder.build('gid_2018_03_29_phimlb_atlmlb_1')
    svg = draw_scorecard.draw(game).tostring()
    return render_template('test.html', svg=Markup(svg))


@app.errorhandler(404)
def not_found(error):
    return render_template('index.html')


@app.errorhandler(500)
def not_found(error):
    return render_template('index.html')

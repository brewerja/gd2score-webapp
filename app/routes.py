import os
import urllib
import datetime

import statsapi
from flask import render_template, abort, jsonify, send_from_directory
from app import app

import gd2score

game_builder = gd2score.GameBuilder()
draw_scorecard = gd2score.DrawScorecard()


def lookup_games(d):
    games_dict = {}
    games = statsapi.schedule(date="%d/%d/%d" % (d.month, d.day, d.year))
    for game in games:
        games_dict[game["game_id"]] = "%s @ %s" % (game["away_name"], game["home_name"])
    return games_dict


@app.route("/")
def index():
    return render_template(
        "index.html", games={}
    )


@app.route("/<string:gid>")
def get_game(gid=None):
    try:
        date_str = statsapi.schedule(game_id=gid)[0]["game_date"]
        date = datetime.date.fromisoformat(date_str)
        games = lookup_games(date)
        return render_template(
            "index.html",
            date=f"{date.year}-{date.month}-{date.day}",
            games=games,
            current_game=gid,
        )
    except (ValueError, urllib.error.HTTPError):
        return abort(404)


@app.route("/svg/<string:gid>")
def svg(gid):
    game = game_builder.build(gid)
    svg = draw_scorecard.draw(game).tostring()
    return jsonify({"svg": svg, "inProgress": game.in_progress})


@app.route("/games/<int:year>-<int:month>-<int:day>")
def get_games(year, month, day):
    return jsonify(lookup_games(datetime.date(year, month, day)))


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(
        os.path.join(app.root_path, "static"),
        "favicon.ico",
        mimetype="image/vnd.microsoft.icon",
    )


@app.errorhandler(404)
def not_found(error):
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template("500.html"), 500

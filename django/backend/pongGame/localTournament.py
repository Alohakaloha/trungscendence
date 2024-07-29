from . import pong
import json
import sys
import random
import copy
from channels.generic.websocket import AsyncWebsocketConsumer


def logprint(*args, **kwargs):
	print(*args, file=sys.stderr, **kwargs)


class tournamentHandler():
	def __init__(self):
		self.players = []
		self.nextUp = []
		self.finished_scores = []
		self.nextStage = []
		self.remaining = []
		self.th_status = "idle"
		self.stage = 0
		self.numPlayer = 0
		self.player_status = "idle"
		self.winner = None

	def setRules(self, settings):
		self.rounds_to_win = settings["rounds"]
		self.score_to_win = settings["score"]
		self.players = settings["players"]
		self.numPlayer = len(self.players)
		self.remaining = copy.deepcopy(self.players)
		self.setReady()
		self.nextMatch()


	def currentRules(self):
		data = {
			"type":"rules",
			"score": self.score_to_win,
			"rounds": self.rounds_to_win,
			"mirror": False,
			"players": self.players,
			"number_of_players": self.numPlayer,
			"participants": self.remaining,
			"match": self.nextUp,
			"player1" : self.nextUp[0],
			"player2" : self.nextUp[1],
		}
		return data

	def setReady(self):
		if self.player_status == "ready":
			self.player_status = "idle"
			self.th_status = "idle"

	def saveMatch(self, match):
		self.remaining.remove(self.nextUp[0])
		self.remaining.remove(self.nextUp[1])
		self.nextStage.append(match["winner"])

	def nextMatch(self):
			if(len(self.remaining) > 1):
					self.nextUp = random.sample(self.remaining, 2)
			elif(len(self.remaining) == 0 and len(self.nextStage) == 1):
				logprint("winner set")
				self.th_status = "finished"
				self.winner = self.nextStage[0]
				return
			elif len(self.remaining) == 1 and len(self.nextStage) == 0:
				logprint("winner set")
				self.th_status = "finished"
				self.winner = self.remaining
				return
			else:
				self.nextStage.append([copy.deepcopy(item) for item in self.remaining])
				self.remaining  = copy.deepcopy(self.nextStage)
				self.stage += 1
				self.nextStage = []
				self.nextUp = random.sample(self.remaining, 2)
			return

	def tournamentResults(self, winner):
		winner = {
			"status": self.th_status,
			"winner": self.winner,
			"participants": self.players,
		}
		return winner

	def matchResults(self):
		if self.finished_scores[0] > self.finished_scores[1]:
			match_winner = self.nextUp[0]
		else:
			match_winner = self.nextUp[1]
		result = {
			"stage" : self.stage,
			"player1": self.nextUp[0],
			"player2": self.nextUp[1],
			"player1_score": self.finished_scores[0],
			"player2_score": self.finished_scores[1],
			"winner": match_winner,
		}
		self.finished_scores = []
		self.nextUp = []
		return result

	def tournamentStatus(self):
		data = {
			"type": "rules",
			"score": self.score_to_win,
			"rounds": self.rounds_to_win,
			"status": self.th_status,
			"stage": self.stage,
			"participants": self.players,
			"remaining": self.remaining,
			"nextUp": self.nextUp,
			"nextStage": self.nextStage,
			"player1" : self.nextUp[0],
			"player2" : self.nextUp[1],
		}
		return data
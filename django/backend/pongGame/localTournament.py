from . import pong
import json
import random
import copy
from channels.generic.websocket import AsyncWebsocketConsumer


class tournamentHandler():
	def __init__(self):
		self.players = []
		self.nextUp = []
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
		self.remaining = self.players


	def currentRules(self):
		data = {
			"score_to_win": self.score_to_win,
			"rounds_to_win": self.rounds_to_win,
			"players": self.players,
			"number_of_players": self.numPlayer,
			"participants": self.remaining
		}
		return data

	def setReady(self):
		if self.player_status == "ready":
			self.player_status = "idle"
			self.th_status = "ready"


	def luckyWinner(self):
		if len(self.participants) % 2 != 0:
			lucky = random.randint(0, len(self.participants) - 1)
			lucky_participant = self.participants[lucky]
			del self.remaining[lucky]
			self.nextStage.append(lucky_participant)

	def tournamentStatus(self):
		data = {
			"status": self.th_status,
			"stage": self.stage,
			"participants": self.remaining,
			"nextUp": self.nextUp,
			"nextStage": self.nextStage,
		}
		return data
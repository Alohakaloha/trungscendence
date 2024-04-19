import asyncio

class Tournament:
	def __init__(self):
		self.status = "idle"
		self.participants = 1
		self.players = []
		self.winner = None

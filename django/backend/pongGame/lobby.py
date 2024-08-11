import copy

class remote_lobby:
	def __init__(self, host):
		self.host = host
		self.players = []
		self.players.append(host)
		